import { useApiUrl, useCustom, useCustomMutation } from "@refinedev/core";
import { Form, App, ModalProps } from "antd";
import { useState } from "react";

export const useApprovalTransition = (
  resource: string,
  id?: string | number,
) => {
  const [form] = Form.useForm();

  // Access context-aware message, notification, and modal via Ant Design App hook
  const { message } = App.useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Base URL helper to avoid repetition
  const apiUrl = useApiUrl();
  const baseUrl = `${apiUrl}/${resource}/${id}`;

  // Queries
  const {
    result: currentStateData,
    query: { isLoading: currentStateLoading, refetch: refetchCurrentState },
  } = useCustom({
    url: `${baseUrl}/state`,
    method: "get",
    queryOptions: { enabled: !!id },
  });

  const {
    result: approvalsTimelineData,
    query: { isLoading: approvalsTimelineLoading, refetch: refetchEvents },
  } = useCustom({
    url: `${baseUrl}/approvals-timeline`,
    method: "get",
    queryOptions: { enabled: !!id },
  });

  const {
    result: availableStatesData,
    query: {
      isLoading: availableStatesLoading,
      refetch: refetchAvailableStates,
    },
  } = useCustom({
    url: `${baseUrl}/available-states`,
    method: "get",
    queryOptions: { enabled: !!id },
  });

  // Mutation
  const { mutateAsync: changeStateMutate } = useCustomMutation();

  const showModal = (newState: string) => {
    setSelectedState(newState);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = async (onSuccessCallback?: () => void) => {
    try {
      const values = await form.validateFields();

      await changeStateMutate({
        url: `${baseUrl}/state`,
        method: "patch",
        values: { newState: selectedState, reason: values.reason },
      });

      // Picks up the app context successfully
      message.success(`State changed to ${selectedState}`);
      setIsModalOpen(false);
      form.resetFields();

      // Refresh all local state data
      await Promise.all([
        refetchEvents(),
        refetchCurrentState(),
        refetchAvailableStates(),
      ]);

      if (onSuccessCallback) onSuccessCallback();
    } catch (error: any) {
      console.error("State Change Failed:", error);
    }
  };

  const modalProps: ModalProps = {
    open: isModalOpen,
    onOk: () => handleOk(),
    onCancel: handleCancel,
    title: `Change State to ${selectedState}`,
    // Ensure you don't add non-Modal properties here
  };

  return {
    // Data & Loading States
    currentState: currentStateData?.data?.state || "Unknown",
    currentStateLoading,
    approvalsTimeline: approvalsTimelineData?.data || [],
    approvalsTimelineIsLoading: approvalsTimelineLoading,
    availableStates: availableStatesData?.data || [],
    availableStatesLoading,
    selectedState,
    // Modal & Form
    modalProps,
    form,
    showModal,
    stateToButton: {
      SUBMITTED: "Submit",
      CANCELLED: "Cancel",
      APPROVED: "Approve",
      REJECTED: "Reject",
    },
  };
};
