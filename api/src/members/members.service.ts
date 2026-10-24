import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MembersExportService } from './members-export.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto, ExportFormat } from './dto/query-member.dto';
import { ImportReport } from './dto/import-member.dto';
import { GenerateLetterDto } from './dto/letter-member.dto';
import { PaginatedResult, paginate } from '../common/dto/pagination.dto';
import { Member, MemberStatus, Sex, Prisma } from '@prisma/client';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly exportService: MembersExportService,
  ) {}

  /**
   * Generates the next sequential member number: AS-YYYY-0001
   */
  async generateMemberNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `AS-${currentYear}-`;

    const latestMember = await this.prisma.member.findFirst({
      where: {
        memberNo: {
          startsWith: prefix,
        },
      },
      orderBy: {
        memberNo: 'desc',
      },
      select: {
        memberNo: true,
      },
    });

    let nextSequence = 1;
    if (latestMember && latestMember.memberNo) {
      const parts = latestMember.memberNo.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq)) {
          nextSequence = seq + 1;
        }
      }
    }

    const paddedSequence = String(nextSequence).padStart(4, '0');
    return `${prefix}${paddedSequence}`;
  }

  /**
   * Create a new member
   */
  async create(dto: CreateMemberDto, createdByUserId?: string): Promise<Member> {
    // Check if phone or email already exists among non-deleted members
    if (dto.phone) {
      const existingPhone = await this.prisma.member.findFirst({
        where: { phone: dto.phone, deletedAt: null },
      });
      if (existingPhone) {
        throw new ConflictException(`Member with phone number ${dto.phone} already exists`);
      }
    }

    if (dto.email) {
      const existingEmail = await this.prisma.member.findFirst({
        where: { email: dto.email, deletedAt: null },
      });
      if (existingEmail) {
        throw new ConflictException(`Member with email ${dto.email} already exists`);
      }
    }

    if (dto.departmentId) {
      const deptExists = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!deptExists) {
        throw new BadRequestException(`Department with ID ${dto.departmentId} not found`);
      }
    }

    const memberNo = await this.generateMemberNumber();

    const member = await this.prisma.member.create({
      data: {
        memberNo,
        firstName: dto.firstName,
        fatherName: dto.fatherName,
        grandfatherName: dto.grandfatherName,
        baptismalName: dto.baptismalName,
        sex: dto.sex,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        phone: dto.phone,
        email: dto.email,
        region: dto.region,
        zone: dto.zone,
        woreda: dto.woreda,
        kebele: dto.kebele,
        addressDetail: dto.addressDetail,
        parish: dto.parish,
        confessionFather: dto.confessionFather,
        educationLevel: dto.educationLevel,
        occupation: dto.occupation,
        emergencyName: dto.emergencyName,
        emergencyPhone: dto.emergencyPhone,
        departmentId: dto.departmentId,
        photoUrl: dto.photoUrl,
        status: dto.status || MemberStatus.pending,
        notes: dto.notes,
        userId: dto.userId,
        createdBy: createdByUserId,
      },
      include: {
        department: true,
      },
    });

    this.logger.log(`Created member ${member.memberNo} (${member.firstName} ${member.fatherName})`);
    return member;
  }

  /**
   * Find members with search, filters, pagination, and sorting
   */
  async findAll(query: QueryMemberDto): Promise<PaginatedResult<Member>> {
    const { page = 1, limit = 20, search, sort, status, departmentId, sex, parish } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MemberWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (sex) {
      where.sex = sex;
    }

    if (parish) {
      where.parish = {
        contains: parish,
      };
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { memberNo: { contains: term } },
        { firstName: { contains: term } },
        { fatherName: { contains: term } },
        { grandfatherName: { contains: term } },
        { baptismalName: { contains: term } },
        { phone: { contains: term } },
        { email: { contains: term } },
      ];
    }

    let orderBy: Prisma.MemberOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort) {
      const [field, order] = sort.split(':');
      const sortOrder = order?.toLowerCase() === 'asc' ? 'asc' : 'desc';
      if (
        ['firstName', 'fatherName', 'memberNo', 'joinedAt', 'createdAt', 'status'].includes(field)
      ) {
        orderBy = { [field]: sortOrder };
      }
    }

    const [members, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          department: true,
        },
      }),
      this.prisma.member.count({ where }),
    ]);

    return paginate(members, total, page, limit);
  }

  /**
   * Find single member by ID
   */
  /**
   * Get all departments
   */
  async getDepartments() {
    return this.prisma.department.findMany({
      orderBy: { nameAm: 'asc' },
    });
  }

  async findOne(id: string): Promise<any> {
    const member = await this.prisma.member.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
            roleId: true,
          },
        },
        enrollments: {
          include: {
            course: true,
            grades: true,
          },
        },
        attendances: {
          take: 15,
          orderBy: { sessionDate: 'desc' },
          include: {
            course: true,
          },
        },
        contributions: {
          take: 15,
          orderBy: { paidAt: 'desc' },
        },
        certificates: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID "${id}" not found`);
    }

    const auditLogs = await this.prisma.auditLog.findMany({
      where: { entity: 'Member', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      ...member,
      statusHistory: auditLogs,
    };
  }

  /**
   * Find profile of logged-in user's member record
   */
  async findMyProfile(user: any): Promise<any> {
    const member = await this.prisma.member.findFirst({
      where: {
        OR: [
          { userId: user.id },
          ...(user.member?.id ? [{ id: user.member.id }] : []),
        ],
        deletedAt: null,
      },
    });

    if (!member) {
      throw new NotFoundException('No member record associated with current user');
    }

    return this.findOne(member.id);
  }

  /**
   * Update profile of logged-in user's member record
   */
  async updateMyProfile(user: any, dto: UpdateMemberDto): Promise<Member> {
    const member = await this.prisma.member.findFirst({
      where: {
        OR: [
          { userId: user.id },
          ...(user.member?.id ? [{ id: user.member.id }] : []),
        ],
        deletedAt: null,
      },
    });

    if (!member) {
      throw new NotFoundException('No member record associated with current user');
    }

    return this.update(member.id, dto);
  }

  /**
   * Update member
   */
  async update(id: string, dto: UpdateMemberDto): Promise<Member> {
    await this.findOne(id);

    if (dto.phone) {
      const duplicatePhone = await this.prisma.member.findFirst({
        where: { phone: dto.phone, id: { not: id }, deletedAt: null },
      });
      if (duplicatePhone) {
        throw new ConflictException(
          `Phone number ${dto.phone} is already in use by another member`,
        );
      }
    }

    if (dto.email) {
      const duplicateEmail = await this.prisma.member.findFirst({
        where: { email: dto.email, id: { not: id }, deletedAt: null },
      });
      if (duplicateEmail) {
        throw new ConflictException(`Email ${dto.email} is already in use by another member`);
      }
    }

    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!dept) {
        throw new BadRequestException(`Department ${dto.departmentId} not found`);
      }
    }

    const updated = await this.prisma.member.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      include: {
        department: true,
      },
    });

    this.logger.log(`Updated member ${updated.memberNo}`);
    return updated;
  }

  /**
   * Status workflow: Approve pending member to active
   */
  async approveMember(id: string): Promise<Member> {
    const member = await this.findOne(id);

    if (member.status !== MemberStatus.pending) {
      throw new BadRequestException(
        `Cannot approve member with status "${member.status}". Only "pending" members can be approved.`,
      );
    }

    const updated = await this.prisma.member.update({
      where: { id },
      data: {
        status: MemberStatus.active,
      },
      include: {
        department: true,
      },
    });

    this.logger.log(`Member ${member.memberNo} approved to active status`);
    return updated;
  }

  /**
   * Soft delete member
   */
  async softDelete(id: string): Promise<{ success: boolean; message: string }> {
    const member = await this.findOne(id);

    await this.prisma.member.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Member ${member.memberNo} soft-deleted`);
    return {
      success: true,
      message: `Member ${member.memberNo} has been soft-deleted`,
    };
  }

  /**
   * Upload and optimize member photo
   */
  async uploadPhoto(id: string, file: Express.Multer.File): Promise<Member> {
    const member = await this.findOne(id);

    const photoUrl = await this.storageService.savePhoto(file);

    // If member already had a photo, remove old one from disk
    if (member.photoUrl) {
      await this.storageService.deleteFile(member.photoUrl);
    }

    return this.prisma.member.update({
      where: { id },
      data: { photoUrl },
      include: { department: true },
    });
  }

  /**
   * Bulk import members from Excel (.xlsx) file
   */
  async importExcel(buffer: Buffer, createdByUserId?: string): Promise<ImportReport> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException('The uploaded Excel file does not contain any worksheets');
    }

    const report: ImportReport = {
      total: 0,
      created: 0,
      skipped: 0,
      errorsCount: 0,
      errors: [],
      createdMembers: [],
    };

    const rowsToProcess: Array<{ rowNumber: number; data: any }> = [];

    // Header is on row 2, data starts on row 3
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return; // Skip title banner and header row

      const firstName = row.getCell(1).text?.trim();
      const fatherName = row.getCell(2).text?.trim();
      const grandfatherName = row.getCell(3).text?.trim();
      const baptismalName = row.getCell(4).text?.trim();
      const sexRaw = row.getCell(5).text?.trim()?.toLowerCase();
      const dateOfBirthRaw = row.getCell(6).text?.trim();
      const phone = row.getCell(7).text?.trim();
      const email = row.getCell(8).text?.trim();
      const region = row.getCell(9).text?.trim();
      const zone = row.getCell(10).text?.trim();
      const woreda = row.getCell(11).text?.trim();
      const kebele = row.getCell(12).text?.trim();
      const parish = row.getCell(13).text?.trim();
      const confessionFather = row.getCell(14).text?.trim();
      const educationLevel = row.getCell(15).text?.trim();
      const occupation = row.getCell(16).text?.trim();
      const emergencyName = row.getCell(17).text?.trim();
      const emergencyPhone = row.getCell(18).text?.trim();

      // If entirely empty row, ignore
      if (!firstName && !fatherName && !phone && !email) {
        return;
      }

      rowsToProcess.push({
        rowNumber,
        data: {
          firstName,
          fatherName,
          grandfatherName,
          baptismalName,
          sexRaw,
          dateOfBirthRaw,
          phone,
          email,
          region,
          zone,
          woreda,
          kebele,
          parish,
          confessionFather,
          educationLevel,
          occupation,
          emergencyName,
          emergencyPhone,
        },
      });
    });

    report.total = rowsToProcess.length;

    for (const item of rowsToProcess) {
      const { rowNumber, data } = item;
      const reasons: string[] = [];

      if (!data.firstName) {
        reasons.push('First name (FirstName) is required');
      }
      if (!data.fatherName) {
        reasons.push('Father name (FatherName) is required');
      }

      let sex: Sex = Sex.male;
      if (data.sexRaw === 'male' || data.sexRaw === 'ወንድ' || data.sexRaw === 'm') {
        sex = Sex.male;
      } else if (data.sexRaw === 'female' || data.sexRaw === 'ሴት' || data.sexRaw === 'f') {
        sex = Sex.female;
      } else {
        reasons.push(`Invalid sex value "${data.sexRaw}". Expected "male" or "female"`);
      }

      let dob: Date | null = null;
      if (data.dateOfBirthRaw) {
        const parsedDate = new Date(data.dateOfBirthRaw);
        if (isNaN(parsedDate.getTime())) {
          reasons.push(`Invalid date format for DateOfBirth: ${data.dateOfBirthRaw}`);
        } else {
          dob = parsedDate;
        }
      }

      if (data.phone) {
        const existingPhone = await this.prisma.member.findFirst({
          where: { phone: data.phone, deletedAt: null },
        });
        if (existingPhone) {
          reasons.push(
            `Duplicate phone number "${data.phone}" already belongs to member ${existingPhone.memberNo}`,
          );
        }
      }

      if (data.email) {
        const existingEmail = await this.prisma.member.findFirst({
          where: { email: data.email, deletedAt: null },
        });
        if (existingEmail) {
          reasons.push(
            `Duplicate email "${data.email}" already belongs to member ${existingEmail.memberNo}`,
          );
        }
      }

      if (reasons.length > 0) {
        report.errorsCount++;
        report.errors.push({
          row: rowNumber,
          name: `${data.firstName || ''} ${data.fatherName || ''}`.trim() || undefined,
          reasons,
        });
        report.skipped++;
        continue;
      }

      try {
        const memberNo = await this.generateMemberNumber();
        const created = await this.prisma.member.create({
          data: {
            memberNo,
            firstName: data.firstName,
            fatherName: data.fatherName,
            grandfatherName: data.grandfatherName || null,
            baptismalName: data.baptismalName || null,
            sex,
            dateOfBirth: dob,
            phone: data.phone || null,
            email: data.email || null,
            region: data.region || null,
            zone: data.zone || null,
            woreda: data.woreda || null,
            kebele: data.kebele || null,
            parish: data.parish || null,
            confessionFather: data.confessionFather || null,
            educationLevel: data.educationLevel || null,
            occupation: data.occupation || null,
            emergencyName: data.emergencyName || null,
            emergencyPhone: data.emergencyPhone || null,
            status: MemberStatus.active,
            createdBy: createdByUserId,
          },
        });

        report.created++;
        report.createdMembers.push({
          id: created.id,
          memberNo: created.memberNo,
          fullName: `${created.firstName} ${created.fatherName}`,
        });
      } catch (err: any) {
        report.errorsCount++;
        report.errors.push({
          row: rowNumber,
          name: `${data.firstName} ${data.fatherName}`,
          reasons: [err.message || 'Database error during insertion'],
        });
        report.skipped++;
      }
    }

    return report;
  }

  /**
   * Export a single member to PDF, DOCX, or XLSX
   */
  async exportSingleMember(
    id: string,
    format: ExportFormat,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const member = await this.findOne(id);
    const sanitizedName = encodeURIComponent(
      `${member.firstName}_${member.fatherName}`.replace(/\s+/g, '_'),
    );

    if (format === ExportFormat.PDF) {
      const buffer = await this.exportService.generateSingleMemberPdf(member);
      return {
        buffer,
        mimeType: 'application/pdf',
        filename: `Member_${member.memberNo}_${sanitizedName}.pdf`,
      };
    } else if (format === ExportFormat.DOCX) {
      const buffer = await this.exportService.generateSingleMemberDocx(member);
      return {
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename: `Member_${member.memberNo}_${sanitizedName}.docx`,
      };
    } else {
      const buffer = await this.exportService.generateSingleMemberExcel(member);
      return {
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `Member_${member.memberNo}_${sanitizedName}.xlsx`,
      };
    }
  }

  /**
   * Export all members matching filters to PDF, DOCX, or XLSX
   */
  async exportMembersList(
    query: QueryMemberDto,
    format: ExportFormat,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const where: Prisma.MemberWhereInput = {
      deletedAt: null,
    };

    if (query.status) where.status = query.status;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.sex) where.sex = query.sex;
    if (query.parish) where.parish = { contains: query.parish };

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { memberNo: { contains: term } },
        { firstName: { contains: term } },
        { fatherName: { contains: term } },
        { grandfatherName: { contains: term } },
        { baptismalName: { contains: term } },
        { phone: { contains: term } },
      ];
    }

    const members = await this.prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { department: true },
    });

    const dateStr = new Date().toISOString().split('T')[0];

    if (format === ExportFormat.PDF) {
      const buffer = await this.exportService.generateMembersPdf(members);
      return {
        buffer,
        mimeType: 'application/pdf',
        filename: `Members_Roster_${dateStr}.pdf`,
      };
    } else if (format === ExportFormat.DOCX) {
      const buffer = await this.exportService.generateMembersDocx(members);
      return {
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename: `Members_Roster_${dateStr}.docx`,
      };
    } else {
      const buffer = await this.exportService.generateMembersExcel(members);
      return {
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `Members_Roster_${dateStr}.xlsx`,
      };
    }
  }

  /**
   * Generate Member ID Card PDF
   */
  async generateIdCard(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const member = await this.findOne(id);
    const buffer = await this.exportService.generateIdCardPdf(member);
    return {
      buffer,
      filename: `ID_Card_${member.memberNo}.pdf`,
    };
  }

  /**
   * Generate official letter (Confirmation or Recommendation)
   */
  async generateLetter(
    id: string,
    dto: GenerateLetterDto,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const member = await this.findOne(id);
    const buffer = await this.exportService.generateLetterPdf(
      member,
      dto.type,
      dto.recipient,
      dto.purpose,
    );
    return {
      buffer,
      filename: `Letter_${dto.type}_${member.memberNo}.pdf`,
    };
  }

  /**
   * Get Excel template for bulk import
   */
  async getImportTemplate(): Promise<Buffer> {
    return this.exportService.generateImportTemplateExcel();
  }

  /**
   * Export complete member data (GDPR / Data Safety)
   */
  async exportMyData(user: any): Promise<any> {
    const member = await this.prisma.member.findFirst({
      where: {
        OR: [
          { userId: user.id },
          ...(user.member?.id ? [{ id: user.member.id }] : []),
        ],
        deletedAt: null,
      },
      include: {
        department: true,
        enrollments: {
          include: {
            course: true,
            grades: true,
          },
        },
        attendances: {
          include: {
            course: true,
          },
        },
        contributions: true,
        certificates: {
          include: {
            course: true,
          },
        },
        formResponses: {
          include: {
            form: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('No member profile associated with current user');
    }

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      member,
    };
  }

  /**
   * Delete or deactivate own member account (GDPR / Data Safety)
   */
  async deleteMyAccount(user: any): Promise<{ message: string }> {
    const member = await this.prisma.member.findFirst({
      where: {
        OR: [
          { userId: user.id },
          ...(user.member?.id ? [{ id: user.member.id }] : []),
        ],
        deletedAt: null,
      },
    });

    if (member) {
      await this.prisma.member.update({
        where: { id: member.id },
        data: {
          deletedAt: new Date(),
          status: 'inactive',
        },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { status: 'suspended' },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });

    return {
      message: 'Account successfully deactivated and member data removed.',
    };
  }
}
