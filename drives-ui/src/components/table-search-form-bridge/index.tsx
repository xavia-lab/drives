"use client";

import { Form } from "antd";
import type { FormProps } from "antd";

/**
 * Refine's antd `useTable` always creates a search form instance, even when a
 * list page does not render a search form. Mounting this hidden bridge connects
 * that instance so rc-field-form does not warn about an orphaned form.
 */
export const TableSearchFormBridge = (
  formProps: Omit<FormProps<unknown>, "children">,
) => <Form {...formProps} style={{ display: "none" }} aria-hidden />;
