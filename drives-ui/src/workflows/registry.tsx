import { HddOutlined } from "@ant-design/icons";
import type { WorkflowDefinition } from "@components/workflow";

/**
 * Registry of dashboard workflows. Add a new entry here (plus its page under
 * `src/app/workflows/<key>`) to surface it on the Dashboard.
 */
export const WORKFLOWS: WorkflowDefinition[] = [
  {
    key: "drive-acquisition",
    title: "New Drive Acquisition",
    description:
      "Register a newly purchased drive, its purchase details, receiving datacenter and ACQUIRE lifecycle event.",
    href: "/workflows/drive-acquisition",
    icon: <HddOutlined />,
    category: "Inventory",
  },
];
