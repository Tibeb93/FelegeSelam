import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

const execAsync = promisify(exec);

export interface BackupFileInfo {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: Date;
}

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private readonly backupDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.backupDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private parseDbUrl(): {
    host: string;
    port: string;
    user: string;
    pass: string;
    db: string;
  } {
    const dbUrl =
      process.env.DATABASE_URL || 'mysql://aemade_user:aemade_password@localhost:3306/aemade_selam';
    try {
      const url = new URL(dbUrl);
      return {
        host: url.hostname || 'localhost',
        port: url.port || '3306',
        user: url.username || 'root',
        pass: url.password || '',
        db: url.pathname.replace(/^\//, '') || 'aemade_selam',
      };
    } catch {
      return {
        host: 'localhost',
        port: '3306',
        user: 'aemade_user',
        pass: 'aemade_password',
        db: 'aemade_selam',
      };
    }
  }

  /**
   * Generates a database dump using native mysqldump or direct SQL table serialization
   */
  private async createSqlDump(destinationPath: string): Promise<void> {
    const { host, port, user, pass, db } = this.parseDbUrl();

    // 1. Attempt mysqldump command
    let mysqldumpWorked = false;
    try {
      const passArg = pass ? `-p"${pass}"` : '';
      const dumpCmd = `mysqldump -h ${host} -P ${port} -u ${user} ${passArg} --default-character-set=utf8mb4 ${db} > "${destinationPath}"`;
      await execAsync(dumpCmd);
      if (fs.existsSync(destinationPath) && fs.statSync(destinationPath).size > 100) {
        mysqldumpWorked = true;
        this.logger.log(`mysqldump completed successfully: ${destinationPath}`);
      }
    } catch (err: any) {
      this.logger.warn(
        `mysqldump utility not available or failed (${err.message}). Using database table serializer.`,
      );
    }

    if (mysqldumpWorked) {
      return;
    }

    // 2. Reliable SQL database dump generator fallback via Prisma raw queries
    const tables: Array<{ TABLE_NAME: string }> = await this.prisma.$queryRawUnsafe(
      `SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = '${db}' AND TABLE_TYPE = 'BASE TABLE'`,
    );

    const writeStream = fs.createWriteStream(destinationPath, { encoding: 'utf8' });

    writeStream.write(`-- --------------------------------------------------------\n`);
    writeStream.write(`-- Aemade Selam Sunday School Database Dump\n`);
    writeStream.write(`-- Date: ${new Date().toISOString()}\n`);
    writeStream.write(`-- Database: ${db}\n`);
    writeStream.write(`-- --------------------------------------------------------\n\n`);
    writeStream.write(`SET NAMES utf8mb4;\n`);
    writeStream.write(`SET FOREIGN_KEY_CHECKS = 0;\n\n`);

    for (const { TABLE_NAME: table } of tables) {
      try {
        // DDL
        const createTableResult: any[] = await this.prisma.$queryRawUnsafe(
          `SHOW CREATE TABLE \`${table}\``,
        );
        const createStmt =
          createTableResult[0]?.['Create Table'] || createTableResult[0]?.['create table'];

        writeStream.write(`DROP TABLE IF EXISTS \`${table}\`;\n`);
        if (createStmt) {
          writeStream.write(`${createStmt};\n\n`);
        }

        // Data
        const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM \`${table}\``);
        if (rows && rows.length > 0) {
          for (const row of rows) {
            const keys = Object.keys(row);
            const cols = keys.map((k) => `\`${k}\``).join(', ');
            const vals = keys
              .map((k) => {
                const val = row[k];
                if (val === null || val === undefined) return 'NULL';
                if (typeof val === 'number') return String(val);
                if (typeof val === 'boolean') return val ? '1' : '0';
                if (val instanceof Date) return `'${val.toISOString()}'`;
                if (typeof val === 'object') {
                  const jsonStr = JSON.stringify(val).replace(/'/g, "\\'");
                  return `'${jsonStr}'`;
                }
                const escaped = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                return `'${escaped}'`;
              })
              .join(', ');

            writeStream.write(`INSERT INTO \`${table}\` (${cols}) VALUES (${vals});\n`);
          }
          writeStream.write(`\n`);
        }
      } catch (tableErr: any) {
        this.logger.warn(`Could not export table ${table}: ${tableErr.message}`);
      }
    }

    writeStream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
    writeStream.write(`-- Dump completed on ${new Date().toISOString()}\n`);

    await new Promise((resolve) => writeStream.end(resolve));
    this.logger.log(`SQL database backup created successfully at: ${destinationPath}`);
  }

  /**
   * Retains only the last 30 backup files and deletes older ones
   */
  private rotateBackups(): void {
    try {
      const files = fs
        .readdirSync(this.backupDir)
        .filter((f) => f.endsWith('.sql'))
        .map((f) => {
          const filePath = path.join(this.backupDir, f);
          const stat = fs.statSync(filePath);
          return { filename: f, filePath, mtime: stat.mtimeMs };
        })
        .sort((a, b) => b.mtime - a.mtime); // Newest first

      if (files.length > 30) {
        const toDelete = files.slice(30);
        for (const file of toDelete) {
          fs.unlinkSync(file.filePath);
          this.logger.log(`Rotated and deleted old backup: ${file.filename}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Error rotating backup files: ${err.message}`);
    }
  }

  /**
   * Run backup on demand or via scheduler
   */
  async performBackup(userId?: string): Promise<BackupFileInfo> {
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-aemade-selam-${timestampStr}.sql`;
    const destinationPath = path.join(this.backupDir, filename);

    await this.createSqlDump(destinationPath);
    this.rotateBackups();

    const stat = fs.statSync(destinationPath);

    // Audit Log
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'create',
          entity: 'backup',
          userId: userId || null,
          newValue: {
            filename,
            sizeBytes: stat.size,
          },
        },
      });
    } catch (auditErr: any) {
      this.logger.warn(`Failed to audit backup creation: ${auditErr.message}`);
    }

    return {
      filename,
      sizeBytes: stat.size,
      sizeFormatted: this.formatBytes(stat.size),
      createdAt: stat.birthtime || stat.mtime,
    };
  }

  /**
   * Nightly scheduled backup at midnight (00:00 UTC)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleNightlyBackup() {
    this.logger.log('Executing nightly automated database backup...');
    try {
      const backup = await this.performBackup();
      this.logger.log(`Nightly backup completed: ${backup.filename} (${backup.sizeFormatted})`);
    } catch (err: any) {
      this.logger.error(`Nightly backup failed: ${err.message}`, err.stack);
    }
  }

  /**
   * List all backup files in /backups
   */
  listBackups(): BackupFileInfo[] {
    if (!fs.existsSync(this.backupDir)) return [];

    return fs
      .readdirSync(this.backupDir)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => {
        const filePath = path.join(this.backupDir, f);
        const stat = fs.statSync(filePath);
        return {
          filename: f,
          sizeBytes: stat.size,
          sizeFormatted: this.formatBytes(stat.size),
          createdAt: stat.birthtime || stat.mtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get backup file stream or buffer for download
   */
  getBackupFile(filename: string): { buffer: Buffer; filename: string } {
    // Prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Invalid backup filename');
    }

    const filePath = path.join(this.backupDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Backup file "${filename}" was not found`);
    }

    const buffer = fs.readFileSync(filePath);
    return { buffer, filename };
  }

  /**
   * Delete a backup file
   */
  deleteBackup(filename: string): { success: boolean; message: string } {
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Invalid backup filename');
    }

    const filePath = path.join(this.backupDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Backup file "${filename}" was not found`);
    }

    fs.unlinkSync(filePath);
    return { success: true, message: `Backup file "${filename}" deleted` };
  }
}
