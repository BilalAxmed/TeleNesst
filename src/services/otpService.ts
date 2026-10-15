export interface OtpRecord {
  target: string;
  type: 'email' | 'phone';
  purpose: string;
  code: string;
  createdAt: number;
  expiresAt: number;
}

class OtpService {
  private activeOtps: Map<string, OtpRecord> = new Map();

  public generateOtp(
    target: string,
    type: 'email' | 'phone',
    purpose: string = 'recovery'
  ): { code: string; expiresAt: number } {
    const key = `${type}_${target.trim().toLowerCase()}`;
    // Generate a 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const createdAt = Date.now();
    const expiresAt = createdAt + 5 * 60 * 1000; // 5 minutes validity

    this.activeOtps.set(key, {
      target: target.trim().toLowerCase(),
      type,
      purpose,
      code,
      createdAt,
      expiresAt,
    });

    console.info(`[OtpService] Generated OTP for ${target}: ${code} (Valid for 5 mins)`);
    return { code, expiresAt };
  }

  public verifyOtp(
    target: string,
    type: 'email' | 'phone',
    enteredCode: string
  ): { success: boolean; message: string } {
    const key = `${type}_${target.trim().toLowerCase()}`;
    const record = this.activeOtps.get(key);

    if (!record) {
      return {
        success: false,
        message: 'No active OTP verification code found. Please request a new code.',
      };
    }

    if (Date.now() > record.expiresAt) {
      this.activeOtps.delete(key);
      return {
        success: false,
        message: 'The OTP code has expired. Please request a fresh one.',
      };
    }

    if (record.code.trim() !== enteredCode.trim()) {
      return {
        success: false,
        message: 'Invalid OTP passcode entered. Please check and try again.',
      };
    }

    // Success: Consume OTP
    this.activeOtps.delete(key);
    return {
      success: true,
      message: 'OTP verification successful.',
    };
  }
}

export const otpService = new OtpService();
