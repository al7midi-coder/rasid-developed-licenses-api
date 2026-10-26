import { httpError } from './coordination-common.js';

export const MINUTES_STATES = ['DRAFT', 'UNDER_INTERNAL_REVIEW', 'RETURNED_INTERNAL', 'APPROVED_INTERNAL', 'WAITING_EXTERNAL_SIGNATURES', 'SIGNED_EXTERNAL_UPLOADED', 'WAITING_ORIGINAL_DELIVERY', 'ORIGINAL_RECEIVED', 'COMPLETED', 'CANCELLED'] as const;
export const REQUEST_STATES = ['RECEIVED', 'MISSING_DOCUMENTS', 'DOCUMENTS_COMPLETE', 'REFERRED', 'UNDER_REVIEW', 'RETURNED', 'APPROVED', 'REJECTED', 'WAITING_MINUTES_SIGNATURE', 'WAITING_ORIGINAL_MINUTES', 'COMPLETED'] as const;
export type MinutesState = typeof MINUTES_STATES[number];
export type RequestState = typeof REQUEST_STATES[number];

export const MINUTES_TRANSITIONS: Record<MinutesState, MinutesState[]> = {
  DRAFT: ['UNDER_INTERNAL_REVIEW', 'APPROVED_INTERNAL', 'WAITING_EXTERNAL_SIGNATURES', 'CANCELLED'],
  UNDER_INTERNAL_REVIEW: ['RETURNED_INTERNAL', 'APPROVED_INTERNAL', 'WAITING_EXTERNAL_SIGNATURES', 'CANCELLED'],
  RETURNED_INTERNAL: ['DRAFT', 'UNDER_INTERNAL_REVIEW', 'CANCELLED'],
  APPROVED_INTERNAL: ['WAITING_EXTERNAL_SIGNATURES', 'CANCELLED'],
  WAITING_EXTERNAL_SIGNATURES: ['SIGNED_EXTERNAL_UPLOADED', 'CANCELLED'],
  SIGNED_EXTERNAL_UPLOADED: ['WAITING_ORIGINAL_DELIVERY', 'CANCELLED'],
  WAITING_ORIGINAL_DELIVERY: ['ORIGINAL_RECEIVED', 'CANCELLED'],
  ORIGINAL_RECEIVED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: []
};

export const REQUEST_TRANSITIONS: Record<RequestState, RequestState[]> = {
  RECEIVED: ['MISSING_DOCUMENTS', 'DOCUMENTS_COMPLETE'],
  MISSING_DOCUMENTS: ['DOCUMENTS_COMPLETE'],
  DOCUMENTS_COMPLETE: ['MISSING_DOCUMENTS', 'REFERRED', 'UNDER_REVIEW', 'APPROVED', 'RETURNED', 'WAITING_MINUTES_SIGNATURE'],
  REFERRED: ['UNDER_REVIEW', 'RETURNED', 'DOCUMENTS_COMPLETE'],
  UNDER_REVIEW: ['REFERRED', 'RETURNED', 'APPROVED', 'REJECTED', 'WAITING_MINUTES_SIGNATURE', 'DOCUMENTS_COMPLETE'],
  RETURNED: ['MISSING_DOCUMENTS', 'DOCUMENTS_COMPLETE', 'REFERRED', 'UNDER_REVIEW'],
  APPROVED: [],
  REJECTED: ['DOCUMENTS_COMPLETE'],
  WAITING_MINUTES_SIGNATURE: ['WAITING_ORIGINAL_MINUTES', 'RETURNED', 'DOCUMENTS_COMPLETE'],
  WAITING_ORIGINAL_MINUTES: ['COMPLETED'],
  COMPLETED: []
};

export const canMinutes = (from: string, to: string) => (MINUTES_TRANSITIONS as any)[from]?.includes(to) ?? false;
export const canRequest = (from: string, to: string) => from === to || ((REQUEST_TRANSITIONS as any)[from]?.includes(to) ?? false);

export function assertMinutes(from: string, to: string) {
  if (!canMinutes(from, to)) throw httpError(409, 'لا يمكن تنفيذ هذا الإجراء في الحالة الحالية للمحضر.', 'BAD_STATE');
}
export function assertRequest(from: string, to: string) {
  if (!canRequest(from, to)) throw httpError(409, 'لا يمكن تنفيذ هذا الإجراء في الحالة الحالية للطلب.', 'BAD_STATE');
}

export const MINUTES_EDITABLE: MinutesState[] = ['DRAFT', 'RETURNED_INTERNAL', 'UNDER_INTERNAL_REVIEW'];
export const MINUTES_OPEN_BUCKET: MinutesState[] = ['DRAFT', 'UNDER_INTERNAL_REVIEW', 'RETURNED_INTERNAL', 'APPROVED_INTERNAL', 'WAITING_EXTERNAL_SIGNATURES', 'SIGNED_EXTERNAL_UPLOADED', 'WAITING_ORIGINAL_DELIVERY', 'ORIGINAL_RECEIVED'];
export const MINUTES_DONE_BUCKET: MinutesState[] = ['COMPLETED', 'CANCELLED'];
/** Requests that may still be put into a minutes / referral. */
export const REQUEST_ACTIONABLE: RequestState[] = ['DOCUMENTS_COMPLETE', 'REFERRED', 'UNDER_REVIEW', 'RETURNED'];

/** Public-facing status labels (never expose internal comments). */
export const PUBLIC_STATUS: Record<string, string> = {
  RECEIVED: 'تم استلام الطلب',
  MISSING_DOCUMENTS: 'نقص مرفقات',
  DOCUMENTS_COMPLETE: 'قيد الدراسة',
  REFERRED: 'قيد الدراسة',
  UNDER_REVIEW: 'قيد الدراسة',
  RETURNED: 'معاد للاستكمال',
  APPROVED: 'تمت الموافقة',
  REJECTED: 'مرفوض',
  WAITING_MINUTES_SIGNATURE: 'بانتظار توقيع المحضر',
  WAITING_ORIGINAL_MINUTES: 'بانتظار تسليم أصل المحضر',
  COMPLETED: 'مكتمل'
};

/** Aggregate referral recommendation from recipient statuses. */
export function recommendation(statuses: string[]): 'UNBLOCK' | 'RETURN_REQUEST' | null {
  if (!statuses.length || statuses.some(s => s === 'PENDING')) return null;
  return statuses.every(s => s === 'APPROVED') ? 'UNBLOCK' : 'RETURN_REQUEST';
}
