import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, Index, ManyToOne
} from 'typeorm';
import { Usuario } from './Usuario.entity';

@Entity('notification_subscriptions')
export class NotificationSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', nullable: false })
  user!: Usuario;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  channel!: 'email' | 'push';

  @Index()
  @Column({ type: 'varchar', length: 255 })
  address!: string; // email o pushToken

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
