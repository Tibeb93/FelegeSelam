import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  CreateMezmurCategoryDto,
  UpdateMezmurCategoryDto,
  CreateMezmurDto,
  UpdateMezmurDto,
  QueryMezmurDto,
} from './dto/mezmur.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class MezmursService {
  private readonly logger = new Logger(MezmursService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // =========================================================================
  // 1. MEZMUR CATEGORIES CRUD
  // =========================================================================

  async createCategory(dto: CreateMezmurCategoryDto) {
    const existing = await this.prisma.mezmurCategory.findUnique({
      where: { nameAm: dto.nameAm },
    });
    if (existing) {
      throw new ConflictException(`Mezmur category "${dto.nameAm}" already exists`);
    }

    return this.prisma.mezmurCategory.create({
      data: {
        nameAm: dto.nameAm,
        nameEn: dto.nameEn ?? null,
      },
    });
  }

  async findAllCategories(query: PaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MezmurCategoryWhereInput = {};
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [{ nameAm: { contains: term } }, { nameEn: { contains: term } }];
    }

    let orderBy: Prisma.MezmurCategoryOrderByWithRelationInput = { id: 'asc' };
    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      if (
        ['id', 'nameAm', 'nameEn', 'createdAt'].includes(field) &&
        (direction === 'asc' || direction === 'desc')
      ) {
        orderBy = { [field]: direction };
      }
    }

    const [categories, total] = await Promise.all([
      this.prisma.mezmurCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { mezmurs: true },
          },
        },
      }),
      this.prisma.mezmurCategory.count({ where }),
    ]);

    return paginate(categories, total, page, limit);
  }

  async updateCategory(id: number, dto: UpdateMezmurCategoryDto) {
    const category = await this.prisma.mezmurCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Mezmur category ${id} not found`);
    }

    if (dto.nameAm && dto.nameAm !== category.nameAm) {
      const dup = await this.prisma.mezmurCategory.findUnique({
        where: { nameAm: dto.nameAm },
      });
      if (dup) {
        throw new ConflictException(`Mezmur category "${dto.nameAm}" already exists`);
      }
    }

    return this.prisma.mezmurCategory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: number) {
    const category = await this.prisma.mezmurCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Mezmur category ${id} not found`);
    }

    await this.prisma.mezmurCategory.delete({ where: { id } });
    return { id, deleted: true };
  }

  // =========================================================================
  // 2. MEZMUR CRUD, FULL-TEXT SEARCH & AUDIO/VIDEO UPLOADS
  // =========================================================================

  async createMezmur(dto: CreateMezmurDto, createdBy?: string) {
    if (dto.categoryId) {
      const cat = await this.prisma.mezmurCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!cat) {
        throw new BadRequestException(`Category ${dto.categoryId} not found`);
      }
    }

    const mezmur = await this.prisma.mezmur.create({
      data: {
        title: dto.title,
        lyrics: dto.lyrics ?? null,
        categoryId: dto.categoryId ?? null,
        singer: dto.singer ?? null,
        audioUrl: dto.audioUrl ?? null,
        videoUrl: dto.videoUrl ?? null,
        isPublic: dto.isPublic ?? true,
        createdBy: createdBy ?? null,
      },
      include: {
        category: true,
        _count: {
          select: { favorites: true },
        },
      },
    });

    this.logger.log(`Mezmur created: ${mezmur.id} (${mezmur.title})`);
    return mezmur;
  }

  async findAllMezmurs(query: QueryMezmurDto, publicOnly: boolean = false, user?: any) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MezmurWhereInput = {};

    if (publicOnly) {
      where.isPublic = true;
    } else if (query.isPublic !== undefined) {
      where.isPublic = query.isPublic;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.singer) {
      where.singer = { contains: query.singer };
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      let fulltextIds: string[] = [];
      try {
        const rows = await this.prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM mezmurs
          WHERE MATCH(title, lyrics) AGAINST(${term} IN NATURAL LANGUAGE MODE)
        `;
        fulltextIds = rows.map((r) => r.id);
      } catch {
        // Fallback to contains if term has special syntax
      }

      where.OR = [
        ...(fulltextIds.length > 0 ? [{ id: { in: fulltextIds } }] : []),
        { title: { contains: term } },
        { lyrics: { contains: term } },
        { singer: { contains: term } },
      ];
    }

    let orderBy: Prisma.MezmurOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      if (
        ['title', 'singer', 'createdAt'].includes(field) &&
        (direction === 'asc' || direction === 'desc')
      ) {
        orderBy = { [field]: direction };
      }
    }

    const [mezmurs, total] = await Promise.all([
      this.prisma.mezmur.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          _count: {
            select: { favorites: true },
          },
        },
      }),
      this.prisma.mezmur.count({ where }),
    ]);

    const memberId = user?.member?.id;
    let favoriteSet = new Set<string>();
    if (memberId && mezmurs.length > 0) {
      const favs = await this.prisma.favorite.findMany({
        where: {
          memberId,
          mezmurId: { in: mezmurs.map((m) => m.id) },
        },
      });
      favoriteSet = new Set(favs.map((f) => f.mezmurId));
    }

    const enriched = mezmurs.map((m) => ({
      ...m,
      isFavorited: favoriteSet.has(m.id),
    }));

    return paginate(enriched, total, page, limit);
  }

  async findOneMezmur(id: string, publicOnly: boolean = false, user?: any) {
    const mezmur = await this.prisma.mezmur.findUnique({
      where: { id },
      include: {
        category: true,
        _count: {
          select: { favorites: true },
        },
      },
    });

    if (!mezmur || (publicOnly && !mezmur.isPublic)) {
      throw new NotFoundException(`Mezmur with ID ${id} not found`);
    }

    let isFavorited = false;
    if (user?.member?.id) {
      const fav = await this.prisma.favorite.findUnique({
        where: {
          memberId_mezmurId: {
            memberId: user.member.id,
            mezmurId: id,
          },
        },
      });
      isFavorited = !!fav;
    }

    return {
      ...mezmur,
      isFavorited,
    };
  }

  async updateMezmur(id: string, dto: UpdateMezmurDto) {
    const existing = await this.prisma.mezmur.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Mezmur with ID ${id} not found`);
    }

    if (dto.categoryId) {
      const cat = await this.prisma.mezmurCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!cat) {
        throw new BadRequestException(`Category ${dto.categoryId} not found`);
      }
    }

    return this.prisma.mezmur.update({
      where: { id },
      data: dto,
      include: {
        category: true,
        _count: {
          select: { favorites: true },
        },
      },
    });
  }

  async uploadMezmurMedia(id: string, file: Express.Multer.File, type: 'audio' | 'video') {
    const mezmur = await this.prisma.mezmur.findUnique({ where: { id } });
    if (!mezmur) {
      throw new NotFoundException(`Mezmur with ID ${id} not found`);
    }

    const fileUrl = await this.storageService.saveMezmurMedia(file, type);

    const oldUrl = type === 'audio' ? mezmur.audioUrl : mezmur.videoUrl;
    if (oldUrl && oldUrl.startsWith('/uploads/')) {
      await this.storageService.deleteFile(oldUrl);
    }

    return this.prisma.mezmur.update({
      where: { id },
      data: type === 'audio' ? { audioUrl: fileUrl } : { videoUrl: fileUrl },
      include: { category: true },
    });
  }

  async deleteMezmur(id: string) {
    const mezmur = await this.prisma.mezmur.findUnique({ where: { id } });
    if (!mezmur) {
      throw new NotFoundException(`Mezmur with ID ${id} not found`);
    }

    if (mezmur.audioUrl && mezmur.audioUrl.startsWith('/uploads/')) {
      await this.storageService.deleteFile(mezmur.audioUrl);
    }
    if (mezmur.videoUrl && mezmur.videoUrl.startsWith('/uploads/')) {
      await this.storageService.deleteFile(mezmur.videoUrl);
    }

    await this.prisma.mezmur.delete({ where: { id } });
    return { id, deleted: true };
  }

  // =========================================================================
  // 3. MEMBER FAVORITES
  // =========================================================================

  private async resolveMemberId(user: any): Promise<string> {
    if (user?.member?.id) {
      return user.member.id;
    }
    const member = await this.prisma.member.findFirst({
      where: { userId: user?.id, deletedAt: null },
    });
    if (!member) {
      throw new BadRequestException('User account is not linked to an active member profile');
    }
    return member.id;
  }

  async addFavorite(mezmurId: string, user: any) {
    const memberId = await this.resolveMemberId(user);

    const mezmur = await this.prisma.mezmur.findUnique({ where: { id: mezmurId } });
    if (!mezmur) {
      throw new NotFoundException(`Mezmur ${mezmurId} not found`);
    }

    await this.prisma.favorite.upsert({
      where: {
        memberId_mezmurId: {
          memberId,
          mezmurId,
        },
      },
      update: {},
      create: {
        memberId,
        mezmurId,
      },
    });

    return {
      memberId,
      mezmurId,
      favorited: true,
    };
  }

  async removeFavorite(mezmurId: string, user: any) {
    const memberId = await this.resolveMemberId(user);

    await this.prisma.favorite.deleteMany({
      where: {
        memberId,
        mezmurId,
      },
    });

    return {
      memberId,
      mezmurId,
      favorited: false,
    };
  }

  async findMyFavorites(query: PaginationDto, user: any) {
    const memberId = await this.resolveMemberId(user);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FavoriteWhereInput = { memberId };
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.mezmur = {
        OR: [
          { title: { contains: term } },
          { lyrics: { contains: term } },
          { singer: { contains: term } },
        ],
      };
    }

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          mezmur: {
            include: {
              category: true,
            },
          },
        },
      }),
      this.prisma.favorite.count({ where }),
    ]);

    const items = favorites.map((f) => ({
      ...f.mezmur,
      favoritedAt: f.createdAt,
      isFavorited: true,
    }));

    return paginate(items, total, page, limit);
  }
}
