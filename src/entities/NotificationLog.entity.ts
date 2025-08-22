import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  kind!: 'reserva-creada' | 'reserva-recordatorio' | 'custom';

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload!: any;

  @Column({ type: 'varchar', length: 20, default: 'SENT' })
  status!: 'SENT' | 'FAILED';

  @CreateDateColumn()
  createdAt!: Date;
}
