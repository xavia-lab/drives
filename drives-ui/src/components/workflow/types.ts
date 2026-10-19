import type { FormInstance } from "antd";
import type { ReactNode } from "react";

// Loosely-typed form bag shared between wizard steps and the submit handler.
// Individual workflows narrow it to their own value shape.
export type WorkflowValues = Record<string, unknown>;

export interface WorkflowStepContext {
  form: FormInstance;
  values: WorkflowValues;
}

export interface WorkflowStep {
  key: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  /**
   * Form field paths validated before the user may advance past this step.
   * The paths are passed to antd's `form.validateFields`.
   */
  fields: (string | number)[][];
  content: (context: WorkflowStepContext) => ReactNode;
}

export interface WorkflowDefinition {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  /** Small eyebrow label on the launch card, e.g. "Inventory". */
  category?: string;
}
