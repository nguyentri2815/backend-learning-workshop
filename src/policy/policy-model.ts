import { useState } from 'react';
import type { ReadingStep } from '../content/policy/lesson';
import { creationContext } from './create-model';

export const POLICY_PROGRESS_KEY = 'backend-learning-workshop.policy-reading.v1';
export const MISSING_POLICY_ID = 'POL-NOT-FOUND';
export const statusLabels: Record<number, string> = {0: 'Chưa tới hiệu lực', 100: 'Đang có hiệu lực', [-1]: 'Hết hiệu lực'};
export interface SamplePolicy {
  id: string; policyCode: string; customerName: string; status: number;
  unit: string; insuranceTotalAmount: number;
}
// Entirely invented fixtures. Unit membership is a teaching scenario, not real authorization.
export const samplePolicies: SamplePolicy[] = [
  {id: 'POL-LEARN-001', policyCode: 'S-DEMO-001', customerName: 'Khách hàng mẫu An', status: 100, unit: 'DV-A', insuranceTotalAmount: 1200000},
  {id: 'POL-LEARN-002', policyCode: 'S-DEMO-002', customerName: 'Khách hàng mẫu Bình', status: 100, unit: 'DV-A', insuranceTotalAmount: 2400000},
  {id: 'POL-LEARN-003', policyCode: 'S-DEMO-003', customerName: 'Khách hàng mẫu Chi', status: 100, unit: 'DV-A', insuranceTotalAmount: 3600000},
  {id: 'POL-LEARN-004', policyCode: 'S-DEMO-004', customerName: 'Khách hàng mẫu Dũng', status: 0, unit: 'DV-A', insuranceTotalAmount: 4800000},
  {id: 'POL-LEARN-005', policyCode: 'S-DEMO-005', customerName: 'Khách hàng mẫu Hà', status: -1, unit: 'DV-A', insuranceTotalAmount: 500000},
  {id: 'POL-LEARN-006', policyCode: 'S-DEMO-006', customerName: 'Khách hàng mẫu Lan', status: 100, unit: 'DV-B', insuranceTotalAmount: 600000},
];
export interface SearchInput { keyword: string; status: string; pageNumber: number; pageSize: number }
export function makeSearchRequest(input: SearchInput) {
  return {keyword: input.keyword.trim(), ...(input.status === 'all' ? {} : {status: Number(input.status)}), pageNumber: input.pageNumber, pageSize: input.pageSize, sort: [{key: 'policyCode', asc: true}]};
}
export function searchSamples(input: SearchInput, extra: SamplePolicy[] = []) {
  const keyword = input.keyword.trim().toLowerCase();
  const filtered = [...samplePolicies, ...extra].filter(item => item.unit === 'DV-A')
    .filter(item => input.status === 'all' || item.status === Number(input.status))
    .filter(item => `${item.policyCode},${item.customerName}`.toLowerCase().includes(keyword))
    .sort((a, b) => a.policyCode.localeCompare(b.policyCode));
  const content = filtered.slice(input.pageNumber * input.pageSize, (input.pageNumber + 1) * input.pageSize)
    .map(({id, policyCode, customerName, status}) => ({id, policyCode, customerName, status}));
  const totalElements = filtered.length;
  return {content, totalElements, number: input.pageNumber, size: input.pageSize, totalPages: Math.ceil(totalElements / input.pageSize)};
}
export function detailSample(id: string, extra: SamplePolicy[] = []) {
  const policy = [...samplePolicies, ...extra].find(item => item.id === id);
  if (!policy) return null;
  return {id: policy.id, policyCode: policy.policyCode, customerName: policy.customerName, status: policy.status,
    insuredObjects: [{id: `INS-${policy.id}`}],
    paymentInfoPolicyModel: {totalInsuranceAmount: policy.insuranceTotalAmount},
  };
}
export const sampleResponse = <T,>(data: T) => ({success: true, statusCode: '200', data});
export function readPolicyContext(params: URLSearchParams) {
  const knownSteps: ReadingStep[] = ['search', 'detail', 'trace', 'missing'];
  const requestedStep = params.get('step') ?? (params.get('group') === 'detail' ? 'detail' : 'search');
  const legacyLink = params.has('file') || params.has('side');
  const step = !legacyLink && knownSteps.includes(requestedStep as ReadingStep) ? requestedStep as ReadingStep : 'search';
  const selected = params.get('selected') ?? '';
  const created = creationContext(params);
  const available = [...samplePolicies, ...(created.commandReady ? [created.policy] : [])];
  const validSelected = available.some(item => item.id === selected && item.unit === 'DV-A') ? selected : '';
  const status = params.get('status') ?? '100';
  const size = params.get('size') === '3' ? 3 : 2;
  const pageText = params.get('page') ?? '0';
  const pageNumber = /^\d{1,4}$/.test(pageText) ? Number(pageText) : 0;
  const hasSearch = params.get('searched') === '1';
  return {step, selected: validSelected, hasSearch, input: {keyword: params.get('keyword') ?? 'S-DEMO', status: ['all', '0', '100', '-1'].includes(status) ? status : '100', pageSize: size, pageNumber},
    invalid: legacyLink || !knownSteps.includes(requestedStep as ReadingStep) || (selected !== '' && !validSelected),
  };
}
export interface PolicyProgress { completed: ReadingStep[] }
export function usePolicyProgress() {
  const [progress, setProgress] = useState<PolicyProgress>(() => {
    try {
      const value = JSON.parse(localStorage.getItem(POLICY_PROGRESS_KEY) ?? 'null');
      const valid: ReadingStep[] = ['search', 'detail', 'trace', 'missing'];
      return {completed: Array.isArray(value?.completed) ? valid.filter(step => value.completed.includes(step)) : []};
    } catch { return {completed: []}; }
  });
  const [warning, setWarning] = useState('');
  function save(value: PolicyProgress) {
    setProgress(value);
    try { localStorage.setItem(POLICY_PROGRESS_KEY, JSON.stringify(value)); setWarning(''); }
    catch { setWarning('Chưa lưu được tiến độ Policy trên trình duyệt. Bạn vẫn có thể học trong phiên này.'); }
  }
  return {...progress, warning, toggle: (step: ReadingStep) => save({completed: progress.completed.includes(step) ? progress.completed.filter(id => id !== step) : [...progress.completed, step]}), reset: () => save({completed: []})};
}
export type PolicyLearningProgress = ReturnType<typeof usePolicyProgress>;
