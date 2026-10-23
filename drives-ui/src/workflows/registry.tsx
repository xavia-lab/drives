import {
  ApartmentOutlined,
  FileProtectOutlined,
  HddOutlined,
  PaperClipOutlined,
  SwapOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
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
  {
    key: "cpu-acquisition",
    title: "New CPU Acquisition",
    description:
      "Register a purchased processor, select or create its CPU model, and record purchase and warranty details.",
    href: "/workflows/cpu-acquisition",
    icon: <ThunderboltOutlined />,
    category: "Inventory",
  },
  {
    key: "drive-relocation",
    title: "Relocate Drive",
    description:
      "Move an unseated drive to another datacenter location, or assign a location to an unassigned drive.",
    href: "/workflows/drive-relocation",
    icon: <SwapOutlined />,
    category: "Inventory",
  },
  {
    key: "drive-allocation",
    title: "Drive Allocation",
    description:
      "Detach drives from a source server and seat them into another server's slots in a single transaction.",
    href: "/workflows/drive-allocation",
    icon: <ApartmentOutlined />,
    category: "Inventory",
  },
  {
    key: "drive-media-management",
    title: "Drive Media Management",
    description:
      "Review, add and remove photos, invoices and documents attached to a drive in a datacenter.",
    href: "/workflows/drive-media-management",
    icon: <PaperClipOutlined />,
    category: "Inventory",
  },
  {
    key: "create-warranty-claim",
    title: "Create Warranty Claim",
    description:
      "Open an RMA claim for an unseated drive, moving it into the RMA lifecycle state.",
    href: "/workflows/create-warranty-claim",
    icon: <FileProtectOutlined />,
    category: "Warranty",
  },
  {
    key: "progress-warranty-claim",
    title: "Progress Warranty Claim",
    description:
      "Record the next tracking event for an in-progress RMA claim and derive its updated status.",
    href: "/workflows/progress-warranty-claim",
    icon: <SyncOutlined />,
    category: "Warranty",
  },
];
