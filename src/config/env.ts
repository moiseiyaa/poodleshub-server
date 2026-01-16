import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  DATABASE_URL: string;
  PORT: number;
  NODE_ENV: 'production' | 'development';
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  ADMIN_SECRET_KEY: string;
  ADMIN_EMAIL: string;
  FRONTEND_URL: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  GA4_PROPERTY_ID?: string;
  GOOGLE_SERVICE_ACCOUNT_KEY?: string;
}

function validateEnv(): EnvConfig {
  const required = [
    'DATABASE_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM',
    'ADMIN_SECRET_KEY',
    'ADMIN_EMAIL',
    'FRONTEND_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'GA4_PROPERTY_ID',
  ];

  // Debug: Log all environment variables (without sensitive values)
  console.log('🔍 Environment check:');
  required.forEach(key => {
    const value = process.env[key];
    console.log(`${key}: ${value ? '✅ SET' : '❌ MISSING'}`);
  });

  let missing = required.filter((key) => !process.env[key]);
  // If SERVICE_ACCOUNT_KEY is missing but credentials file is set, that's acceptable
  if (missing.includes('GOOGLE_SERVICE_ACCOUNT_KEY') && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    missing = missing.filter((m) => m !== 'GOOGLE_SERVICE_ACCOUNT_KEY');
  }

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: parseInt(process.env.PORT || '4000', 10),
    NODE_ENV: (process.env.NODE_ENV as 'production' | 'development') || 'production',
    SMTP_HOST: process.env.SMTP_HOST!,
    SMTP_PORT: parseInt(process.env.SMTP_PORT!, 10),
    SMTP_USER: process.env.SMTP_USER!,
    SMTP_PASS: process.env.SMTP_PASS!,
    SMTP_FROM: process.env.SMTP_FROM!,
    ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY!,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
  };
}

export const env = validateEnv();
