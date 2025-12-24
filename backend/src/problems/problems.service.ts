import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
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
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('problems')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('findAll error:', error);
          throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return data || [];
      }
      return this.memoryProblems;
    } catch (err: any) {
      console.error('findAll exception:', err);
      throw new HttpException(err.message || 'Failed to fetch problems', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: string): Promise<Problem | undefined> {
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('problems')
          .select('*')
          .eq('id', id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('findOne error:', error);
          throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return data || undefined;
      }
      return this.memoryProblems.find((p) => p.id === id);
    } catch (err: any) {
      console.error('findOne exception:', err);
      throw new HttpException(err.message || 'Failed to fetch problem', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async create(createProblemDto: Partial<Problem>): Promise<Problem> {
    try {
      if (this.supabase) {
        // 기본 데이터
        const insertData: any = {
          title: createProblemDto.title || '새 매매법',
          description: createProblemDto.description || '',
          difficulty: createProblemDto.difficulty || 'easy',
          category: createProblemDto.category || '기타', // 카테고리 기본값
        };

        // 이미지 URL이 있으면 추가 (컬럼이 없으면 무시됨)
        if (createProblemDto.thumbnail_url) {
          insertData.thumbnail_url = createProblemDto.thumbnail_url;
        }
        if (createProblemDto.content_image_url) {
          insertData.content_image_url = createProblemDto.content_image_url;
        }

        const { data, error } = await this.supabase
          .from('problems')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('create error:', error);
          throw new HttpException(`저장 실패: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
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
    } catch (err: any) {
      console.error('create exception:', err);
      throw new HttpException(err.message || '저장에 실패했습니다', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, updateProblemDto: Partial<Problem>): Promise<Problem | null> {
    try {
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

        if (error) {
          console.error('update error:', error);
          throw new HttpException(`수정 실패: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return data;
      }

      const index = this.memoryProblems.findIndex((p) => p.id === id);
      if (index !== -1) {
        this.memoryProblems[index] = { ...this.memoryProblems[index], ...updateProblemDto };
        return this.memoryProblems[index];
      }
      return null;
    } catch (err: any) {
      console.error('update exception:', err);
      throw new HttpException(err.message || '수정에 실패했습니다', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(id: string): Promise<{ success: boolean }> {
    try {
      if (this.supabase) {
        const { error } = await this.supabase
          .from('problems')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('delete error:', error);
          throw new HttpException(`삭제 실패: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { success: true };
      }

      const index = this.memoryProblems.findIndex((p) => p.id === id);
      if (index !== -1) {
        this.memoryProblems.splice(index, 1);
        return { success: true };
      }
      return { success: false };
    } catch (err: any) {
      console.error('delete exception:', err);
      throw new HttpException(err.message || '삭제에 실패했습니다', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
