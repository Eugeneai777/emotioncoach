/**
 * 教练申请 - 个人简介模板与校验工具
 */

export const BIO_TEMPLATE = `【专业背景】
持有 XX 证书，专业受训于 XX 流派/技术（如：CBT 认知行为疗法、IFS 内在家庭系统、焦点解决等）。

【咨询风格】
温暖稳定 ｜ 专业落地 ｜ 深度陪伴

【擅长人群与议题】
面对青少年，懂成长的迷茫与叛逆，不评判、不说教，用平等视角搭建信任桥梁；
面对 20-35 岁青年，共情职场、人际、自我成长中的焦虑与内耗，陪你梳理困惑、重建内在力量。

【我的承诺】
做你情绪的"容器"，也做你成长的"同行者"，陪你慢慢走出困境，找回内在稳定与前行的力量。`;

export const BIO_MIN_LENGTH = 80;
export const BIO_MAX_LENGTH = 500;

/** 大陆手机号校验（11 位，1 开头，第二位 3-9） */
export function isValidChinaMobile(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone.trim());
}

export interface BasicInfoValidationInput {
  displayName: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  specialties: string[];
}

export interface ValidationError {
  field: 'avatarUrl' | 'displayName' | 'phone' | 'bio' | 'specialties';
  message: string;
}

/** 返回首个错误；全部通过返回 null */
export function validateBasicInfo(data: BasicInfoValidationInput): ValidationError | null {
  if (!data.avatarUrl || !data.avatarUrl.trim()) {
    return { field: 'avatarUrl', message: '请上传头像' };
  }
  if (!data.displayName || !data.displayName.trim()) {
    return { field: 'displayName', message: '请填写显示名称' };
  }
  if (!data.phone || !data.phone.trim()) {
    return { field: 'phone', message: '请填写联系电话' };
  }
  if (!isValidChinaMobile(data.phone)) {
    return { field: 'phone', message: '请输入有效的 11 位手机号' };
  }
  if (!data.bio || data.bio.trim().length < BIO_MIN_LENGTH) {
    return { field: 'bio', message: `个人简介至少 ${BIO_MIN_LENGTH} 字（当前 ${data.bio.trim().length} 字）` };
  }
  if (!data.specialties || data.specialties.length === 0) {
    return { field: 'specialties', message: '请至少选择 1 个擅长领域' };
  }
  return null;
}
