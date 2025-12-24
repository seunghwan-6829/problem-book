import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  created_at: string;
}

@Injectable()
export class ProblemsService {
  private memoryProblems: Problem[] = [
    {
      id: '1',
      title: '두 수의 합',
      description: '두 정수 a와 b를 입력받아 a + b를 반환하는 함수를 작성하세요.',
      difficulty: 'easy',
      category: '수학',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: '배열의 최댓값',
      description: '정수 배열이 주어졌을 때, 최댓값을 찾는 함수를 작성하세요.',
      difficulty: 'medium',
      category: '배열',
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: '이진 탐색',
      description: '정렬된 배열에서 특정 값을 찾는 이진 탐색 알고리즘을 구현하세요.',
      difficulty: 'hard',
      category: '알고리즘',
      created_at: new Date().toISOString(),
    },
  ];

  constructor(private supabaseService: SupabaseService) {
    this.initializeProblems();
  }

  private get supabase() {
    return this.supabaseService.getClient();
  }

  private async initializeProblems() {
    if (this.supabase) {
      const { data } = await this.supabase.from('problems').select('id').limit(1);
      
      // 문제가 없으면 기본 문제 추가
      if (!data || data.length === 0) {
        for (const problem of this.memoryProblems) {
          await this.supabase.from('problems').insert({
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            category: problem.category,
          });
        }
      }
    }
  }

  async findAll(): Promise<Problem[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('problems')
        .select('*')
        .order('created_at', { ascending: true });

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
          title: createProblemDto.title || '새 문제',
          description: createProblemDto.description || '',
          difficulty: createProblemDto.difficulty || 'easy',
          category: createProblemDto.category || '기타',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const newProblem: Problem = {
      id: String(this.memoryProblems.length + 1),
      title: createProblemDto.title || '새 문제',
      description: createProblemDto.description || '',
      difficulty: createProblemDto.difficulty || 'easy',
      category: createProblemDto.category || '기타',
      created_at: new Date().toISOString(),
    };
    this.memoryProblems.push(newProblem);
    return newProblem;
  }

  async update(id: string, updateProblemDto: Partial<Problem>): Promise<Problem | null> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('problems')
        .update({
          title: updateProblemDto.title,
          description: updateProblemDto.description,
          difficulty: updateProblemDto.difficulty,
          category: updateProblemDto.category,
        })
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
