import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  thumbnail_url?: string;
  content_image_url?: string;
  created_at: string;
}

@Injectable()
export class ProblemsService {
  private memoryProblems: Problem[] = [];

  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findAll(): Promise<Problem[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('problems')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
    return this.memoryProblems;
  }

  async findOne(id: string): Promise<Problem | undefined> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    }
    return this.memoryProblems.find((p) => p.id === id);
  }

  async create(createProblemDto: Partial<Problem>): Promise<Problem> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('problems')
        .insert({
          title: createProblemDto.title || '새 매매법',
          description: createProblemDto.description || '',
          difficulty: createProblemDto.difficulty || 'easy',
          category: createProblemDto.category || '기타',
          thumbnail_url: createProblemDto.thumbnail_url || null,
          content_image_url: createProblemDto.content_image_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const newProblem: Problem = {
      id: String(this.memoryProblems.length + 1),
      title: createProblemDto.title || '새 매매법',
      description: createProblemDto.description || '',
      difficulty: createProblemDto.difficulty || 'easy',
      category: createProblemDto.category || '기타',
      thumbnail_url: createProblemDto.thumbnail_url,
      content_image_url: createProblemDto.content_image_url,
      created_at: new Date().toISOString(),
    };
    this.memoryProblems.push(newProblem);
    return newProblem;
  }

  async update(id: string, updateProblemDto: Partial<Problem>): Promise<Problem | null> {
    if (this.supabase) {
      const updateData: any = {};
      if (updateProblemDto.title !== undefined) updateData.title = updateProblemDto.title;
      if (updateProblemDto.description !== undefined) updateData.description = updateProblemDto.description;
      if (updateProblemDto.difficulty !== undefined) updateData.difficulty = updateProblemDto.difficulty;
      if (updateProblemDto.category !== undefined) updateData.category = updateProblemDto.category;
      if (updateProblemDto.thumbnail_url !== undefined) updateData.thumbnail_url = updateProblemDto.thumbnail_url;
      if (updateProblemDto.content_image_url !== undefined) updateData.content_image_url = updateProblemDto.content_image_url;

      const { data, error } = await this.supabase
        .from('problems')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const index = this.memoryProblems.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.memoryProblems[index] = { ...this.memoryProblems[index], ...updateProblemDto };
      return this.memoryProblems[index];
    }
    return null;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    if (this.supabase) {
      const { error } = await this.supabase
        .from('problems')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    }

    const index = this.memoryProblems.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.memoryProblems.splice(index, 1);
      return { success: true };
    }
    return { success: false };
  }
}
