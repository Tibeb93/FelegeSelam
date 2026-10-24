import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { FormsExportService } from './forms-export.service';
import {
  CreateFormDto,
  UpdateFormDto,
  SubmitResponseDto,
  ReviewResponseDto,
  QueryFormDto,
  QueryResponseDto,
} from './dto/form.dto';
import { FormAnswersValidator } from './forms-validator';
import { FormSchemaDefinition } from './dto/form-schema.interface';
import { READY_FORM_TEMPLATES } from './templates/form-templates.data';
import { FormStatus, FormResponseStatus, Prisma } from '@prisma/client';

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly formsExportService: FormsExportService,
  ) {}

  private async logAudit(data: {
    action: string;
    entity: string;
    entityId?: string;
    userId?: string;
    ip?: string;
    oldValue?: any;
    newValue?: any;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          entity: data.entity,
          entityId: data.entityId ? String(data.entityId) : null,
          userId: data.userId || null,
          ip: data.ip || null,
          oldValue: data.oldValue || null,
          newValue: data.newValue || null,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to write audit log: ${err.message}`);
    }
  }

  /**
   * Create a new form definition with schema
   */
  async createForm(dto: CreateFormDto, userId?: string) {
    const allowOne =
      dto.allowOneResponsePerMember ?? dto.formSchema?.settings?.allowOneResponsePerMember ?? false;

    const form = await this.prisma.form.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        formSchema: dto.formSchema as unknown as Prisma.InputJsonValue,
        status: dto.status || FormStatus.draft,
        openUntil: dto.openUntil ? new Date(dto.openUntil) : null,
        allowOneResponsePerMember: allowOne,
        createdBy: userId || null,
      },
    });

    await this.logAudit({
      action: 'create',
      entity: 'form',
      entityId: form.id,
      userId,
      newValue: {
        title: form.title,
        status: form.status,
        allowOneResponsePerMember: form.allowOneResponsePerMember,
      },
    });

    return form;
  }

  /**
   * List forms with pagination and status/search filters
   */
  async findAllForms(query: QueryFormDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FormWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [{ title: { contains: term } }, { description: { contains: term } }];
    }

    const [total, forms] = await Promise.all([
      this.prisma.form.count({ where }),
      this.prisma.form.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { responses: true },
          },
        },
      }),
    ]);

    return {
      data: forms.map((f) => ({
        ...f,
        responsesCount: f._count.responses,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Public list of currently active & open forms
   */
  async findPublicOpenForms(query: QueryFormDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FormWhereInput = {
      status: FormStatus.open,
      OR: [{ openUntil: null }, { openUntil: { gte: new Date() } }],
    };

    if (query.search && query.search.trim()) {
      where.title = { contains: query.search.trim() };
    }

    const [total, forms] = await Promise.all([
      this.prisma.form.count({ where }),
      this.prisma.form.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          formSchema: true,
          status: true,
          openUntil: true,
          allowOneResponsePerMember: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data: forms,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single form by ID
   */
  async findOneForm(id: string) {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID "${id}" was not found`);
    }

    return {
      ...form,
      responsesCount: form._count.responses,
    };
  }

  /**
   * Update an existing form
   */
  async updateForm(id: string, dto: UpdateFormDto, userId?: string) {
    const existing = await this.findOneForm(id);

    const updated = await this.prisma.form.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.formSchema !== undefined && {
          formSchema: dto.formSchema as unknown as Prisma.InputJsonValue,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.openUntil !== undefined && {
          openUntil: dto.openUntil ? new Date(dto.openUntil) : null,
        }),
        ...(dto.allowOneResponsePerMember !== undefined && {
          allowOneResponsePerMember: dto.allowOneResponsePerMember,
        }),
      },
    });

    await this.logAudit({
      action: 'update',
      entity: 'form',
      entityId: id,
      userId,
      oldValue: {
        title: existing.title,
        status: existing.status,
      },
      newValue: {
        title: updated.title,
        status: updated.status,
      },
    });

    return updated;
  }

  /**
   * Delete a form
   */
  async deleteForm(id: string, userId?: string) {
    const form = await this.findOneForm(id);

    await this.prisma.form.delete({
      where: { id },
    });

    await this.logAudit({
      action: 'delete',
      entity: 'form',
      entityId: id,
      userId,
      oldValue: {
        title: form.title,
      },
    });

    return { success: true, message: `Form "${form.title}" deleted successfully` };
  }

  /**
   * Retrieve all ready form templates
   */
  getTemplates() {
    return READY_FORM_TEMPLATES.map((t) => ({
      key: t.key,
      title: t.title,
      description: t.description,
      status: t.status,
      allowOneResponsePerMember: t.allowOneResponsePerMember,
      fieldsCount: t.formSchema.fields.length,
      formSchema: t.formSchema,
    }));
  }

  /**
   * Instantiate a new form from a ready template
   */
  async createFromTemplate(templateKey: string, userId?: string) {
    const template = READY_FORM_TEMPLATES.find((t) => t.key === templateKey);
    if (!template) {
      throw new NotFoundException(
        `Template "${templateKey}" not found. Available: ${READY_FORM_TEMPLATES.map((t) => t.key).join(', ')}`,
      );
    }

    return this.createForm(
      {
        title: template.title,
        description: template.description,
        formSchema: template.formSchema,
        status: template.status,
        allowOneResponsePerMember: template.allowOneResponsePerMember,
      },
      userId,
    );
  }

  /**
   * Upload a file field attachment using the StorageService
   */
  async uploadFormFieldFile(file: Express.Multer.File) {
    return this.storageService.saveFormFieldFile(file);
  }

  /**
   * Submit a response to a form: builds schema validator and verifies all rules
   */
  async submitResponse(formId: string, dto: SubmitResponseDto, userId?: string, clientIp?: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID "${formId}" was not found`);
    }

    // 1. Check form status
    if (form.status !== FormStatus.open) {
      throw new BadRequestException(
        `Form is not currently accepting submissions (status: ${form.status})`,
      );
    }

    // 2. Check openUntil expiry date
    if (form.openUntil && new Date() > form.openUntil) {
      throw new BadRequestException(
        `Form submission deadline expired on ${form.openUntil.toISOString()}`,
      );
    }

    // 3. Resolve member if user is logged in
    let memberId: string | null = null;
    if (userId) {
      const member = await this.prisma.member.findFirst({
        where: { userId, deletedAt: null },
      });
      if (member) {
        memberId = member.id;
      }
    }

    // 4. Check one response per member rule
    if (form.allowOneResponsePerMember) {
      if (!memberId) {
        throw new BadRequestException(
          'This form requires an active member account and permits only one response per member',
        );
      }

      const existingResponse = await this.prisma.formResponse.findFirst({
        where: {
          formId,
          memberId,
        },
      });

      if (existingResponse) {
        throw new BadRequestException(
          'You have already submitted a response to this form (one response per member allowed)',
        );
      }
    }

    // 5. Build validator from form schema and reject invalid answers
    const schema = (form.formSchema as unknown as FormSchemaDefinition) || {
      fields: [],
    };
    const validator = new FormAnswersValidator(schema);
    validator.assertValid(dto.answers);

    // 6. Save response
    const response = await this.prisma.formResponse.create({
      data: {
        formId,
        memberId,
        answers: dto.answers as unknown as Prisma.InputJsonValue,
        status: FormResponseStatus.submitted,
      },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // 7. Audit log
    await this.logAudit({
      action: 'submit',
      entity: 'form_response',
      entityId: response.id,
      userId,
      ip: clientIp,
      newValue: {
        formId,
        memberId,
        status: response.status,
      },
    });

    return response;
  }

  /**
   * List responses for a form with filters and pagination (Admin review)
   */
  async findFormResponses(formId: string, query: QueryResponseDto) {
    await this.findOneForm(formId);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FormResponseWhereInput = {
      formId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.memberId) {
      where.memberId = query.memberId;
    }

    if (query.fromDate || query.toDate) {
      where.submittedAt = {};
      if (query.fromDate) {
        where.submittedAt.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        const toD = new Date(query.toDate);
        toD.setHours(23, 59, 59, 999);
        where.submittedAt.lte = toD;
      }
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        {
          member: {
            OR: [
              { firstName: { contains: term } },
              { fatherName: { contains: term } },
              { memberNo: { contains: term } },
              { phone: { contains: term } },
            ],
          },
        },
        {
          reviewNote: { contains: term },
        },
      ];
    }

    const [total, responses] = await Promise.all([
      this.prisma.formResponse.count({ where }),
      this.prisma.formResponse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          member: {
            select: {
              id: true,
              memberNo: true,
              firstName: true,
              fatherName: true,
              phone: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      data: responses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single response details
   */
  async findOneResponse(responseId: string) {
    const response = await this.prisma.formResponse.findUnique({
      where: { id: responseId },
      include: {
        form: true,
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!response) {
      throw new NotFoundException(`Form response with ID "${responseId}" was not found`);
    }

    return response;
  }

  /**
   * Admin review: approve or reject response with note
   */
  async reviewResponse(responseId: string, dto: ReviewResponseDto, reviewerUserId?: string) {
    const existing = await this.findOneResponse(responseId);

    const updated = await this.prisma.formResponse.update({
      where: { id: responseId },
      data: {
        status: dto.status,
        reviewNote: dto.reviewNote || null,
        reviewedBy: reviewerUserId || null,
      },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    await this.logAudit({
      action: 'review',
      entity: 'form_response',
      entityId: responseId,
      userId: reviewerUserId,
      oldValue: {
        status: existing.status,
        reviewNote: existing.reviewNote,
      },
      newValue: {
        status: updated.status,
        reviewNote: updated.reviewNote,
      },
    });

    return updated;
  }

  /**
   * Export all responses for a form to Excel (.xlsx) or PDF (.pdf)
   */
  async exportResponses(
    formId: string,
    format: 'xlsx' | 'pdf',
    query?: QueryResponseDto,
    userId?: string,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID "${formId}" was not found`);
    }

    const where: Prisma.FormResponseWhereInput = { formId };
    if (query?.status) where.status = query.status;
    if (query?.memberId) where.memberId = query.memberId;

    const responses = await this.prisma.formResponse.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    const formWithResponses = {
      ...form,
      responses,
    };

    await this.logAudit({
      action: 'export',
      entity: 'form_response',
      entityId: formId,
      userId,
      newValue: {
        format,
        responsesCount: responses.length,
      },
    });

    const safeTitle = form.title.replace(/[^a-zA-Z0-9_\u1200-\u137F]/g, '_').slice(0, 30);

    if (format === 'xlsx') {
      const buffer = await this.formsExportService.generateResponsesExcel(formWithResponses);
      return {
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `Form_${safeTitle}_responses.xlsx`,
      };
    } else {
      const buffer = await this.formsExportService.generateResponsesPdf(formWithResponses);
      return {
        buffer,
        mimeType: 'application/pdf',
        filename: `Form_${safeTitle}_responses.pdf`,
      };
    }
  }

  /**
   * Find form submissions made by current user / member
   */
  async findMyResponses(user: any) {
    if (!user) return [];
    const member = await this.prisma.member.findFirst({
      where: {
        OR: [{ userId: user.id }, ...(user.member?.id ? [{ id: user.member.id }] : [])],
        deletedAt: null,
      },
    });

    if (!member) {
      return [];
    }

    return this.prisma.formResponse.findMany({
      where: { memberId: member.id },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            openUntil: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
