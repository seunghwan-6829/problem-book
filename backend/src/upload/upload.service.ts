import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UploadService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async uploadImage(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string = 'images',
  ): Promise<{ url: string }> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const uniqueFileName = `${folder}/${Date.now()}-${fileName}`;

    const { data, error } = await this.supabase.storage
      .from('uploads')
      .upload(uniqueFileName, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('uploads')
      .getPublicUrl(uniqueFileName);

    return { url: urlData.publicUrl };
  }

  async deleteImage(url: string): Promise<void> {
    if (!this.supabase || !url) return;

    // Extract path from URL
    const match = url.match(/uploads\/(.+)$/);
    if (!match) return;

    const path = match[1];

    await this.supabase.storage.from('uploads').remove([path]);
  }
}

