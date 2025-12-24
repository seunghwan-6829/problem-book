import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../supabase/supabase.service';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  visit_count: number;
  last_visit: string;
  created_at: string;
}

// 관리자 계정 (이 username으로 가입하면 자동으로 관리자 권한)
const ADMIN_USERNAMES = ['motiol_6829@naver.com', 'admin'];

@Injectable()
export class UsersService {
  private memoryUsers: User[] = [];

  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('users')
        .select('id, username, name, role, visit_count, last_visit, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
    return this.memoryUsers.map(({ password, ...user }) => user);
  }

  async findByUsername(username: string): Promise<User | undefined> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    }
    return this.memoryUsers.find((user) => user.username === username);
  }

  async findById(id: string): Promise<User | undefined> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    }
    return this.memoryUsers.find((user) => user.id === id);
  }

  async create(username: string, password: string, name: string): Promise<User> {
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      throw new Error('이미 존재하는 아이디입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = ADMIN_USERNAMES.includes(username);

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('users')
        .insert({
          username,
          password: hashedPassword,
          name,
          role: isAdmin ? 'admin' : 'user',
          visit_count: 0,
          last_visit: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const newUser: User = {
      id: String(this.memoryUsers.length + 1),
      username,
      password: hashedPassword,
      name,
      role: isAdmin ? 'admin' : 'user',
      visit_count: 0,
      last_visit: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    this.memoryUsers.push(newUser);
    return newUser;
  }

  async incrementVisitCount(userId: string): Promise<void> {
    if (this.supabase) {
      const user = await this.findById(userId);
      if (user) {
        await this.supabase
          .from('users')
          .update({
            visit_count: (user.visit_count || 0) + 1,
            last_visit: new Date().toISOString(),
          })
          .eq('id', userId);
      }
      return;
    }

    const user = this.memoryUsers.find((u) => u.id === userId);
    if (user) {
      user.visit_count += 1;
      user.last_visit = new Date().toISOString();
    }
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User | null> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('users')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const user = this.memoryUsers.find((u) => u.id === userId);
    if (user) {
      user.role = role;
      return user;
    }
    return null;
  }

  async validatePassword(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async getStats() {
    const users = await this.findAll();
    const today = new Date().toDateString();

    return {
      totalUsers: users.length,
      adminCount: users.filter((u) => u.role === 'admin').length,
      userCount: users.filter((u) => u.role === 'user').length,
      todayVisits: users.filter((u) => {
        return new Date(u.last_visit).toDateString() === today;
      }).length,
    };
  }
}
