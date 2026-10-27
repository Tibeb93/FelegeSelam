import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsArray,
  Matches,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PageStatus, MenuLocation, MediaAssetKind, SectionAudience } from '@prisma/client';

export class PageSectionInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsInt()
  orderNo?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsObject()
  content: { am: Record<string, any>; en: Record<string, any> };

  @IsObject()
  config: Record<string, any>;

  @IsOptional()
  @IsObject()
  style?: Record<string, any>;

  @IsOptional()
  @IsEnum(SectionAudience)
  audience?: SectionAudience;
}

export class CreatePageDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens (e.g. "my-page")',
  })
  slug: string;

  @IsString()
  titleAm: string;

  @IsString()
  titleEn: string;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @IsOptional()
  publishAt?: Date | string;

  @IsOptional()
  @IsObject()
  seo?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsArray()
  @Type(() => PageSectionInputDto)
  sections?: PageSectionInputDto[];
}

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  titleAm?: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @IsOptional()
  publishAt?: Date | string;

  @IsOptional()
  @IsObject()
  seo?: Record<string, any>;

  @IsOptional()
  @IsInt()
  expectedVersion?: number;

  @IsOptional()
  @IsArray()
  @Type(() => PageSectionInputDto)
  sections?: PageSectionInputDto[];
}

export class PublishPageDto {
  @IsOptional()
  publishAt?: Date | string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ReorderSectionsDto {
  @IsArray()
  @IsString({ each: true })
  sectionIds: string[];
}

export class QueryPagesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class UpsertMenuDto {
  @IsEnum(MenuLocation)
  location: MenuLocation;

  @IsArray()
  items: any[];
}

export class UpsertUiStringDto {
  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  group?: string;

  @IsString()
  am: string;

  @IsString()
  en: string;
}

export class BulkUpsertUiStringsDto {
  @IsArray()
  strings: UpsertUiStringDto[];
}

export class UpdateThemeDto {
  @IsObject()
  tokens: Record<string, any>;
}

export class QueryMediaDto {
  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsEnum(MediaAssetKind)
  kind?: MediaAssetKind;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;
}

export class CreateMediaDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsEnum(MediaAssetKind)
  kind?: MediaAssetKind;

  @IsOptional()
  @IsString()
  altAm?: string;

  @IsOptional()
  @IsString()
  altEn?: string;

  @IsOptional()
  @IsInt()
  width?: number;

  @IsOptional()
  @IsInt()
  height?: number;

  @IsOptional()
  @IsInt()
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  folder?: string;
}

export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  altAm?: string;

  @IsOptional()
  @IsString()
  altEn?: string;

  @IsOptional()
  @IsString()
  folder?: string;
}
