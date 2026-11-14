import type {ComponentProps} from 'react';
export function LearningTechnicalReference({children,...props}:ComponentProps<'details'>){return <details className="assembly-technical" {...props}><summary>Tra cứu kỹ thuật <span>Giải thích chi tiết · bản đồ kỹ thuật · source · đối chiếu · checkpoint</span></summary>{children}</details>;}
