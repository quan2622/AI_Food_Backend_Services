// cloudinary.service.ts

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary/cloudinary-response';
import streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    const dataUpload = await new Promise<CloudinaryResponse>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (error) {
              return reject(
                new Error(`Cloudinary upload failed: ${error.message}`),
              );
            }

            if (!result) {
              return reject(new Error('Upload failed'));
            }

            resolve(result);
          },
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      },
    );

    return {
      url: dataUpload.secure_url,
    };
  }
}
