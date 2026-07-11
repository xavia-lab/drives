import { useQuery } from "@tanstack/react-query";
import { useApiUrl } from "@refinedev/core";
import { useEffect, useState } from "react";
import { BinaryService } from "@providers/binary-data-provider";

export const useQRCode = (fileId?: string) => {
  const apiUrl = useApiUrl();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["product-qr", fileId],
    queryFn: () => BinaryService.getBlob(`${apiUrl}/files/${fileId}`),
    enabled: !!fileId,
    staleTime: Infinity, // QR codes are usually static
  });

  useEffect(() => {
    if (query.data) {
      const url = URL.createObjectURL(query.data);
      setObjectUrl(url);

      // Cleanup to prevent memory leaks
      return () => URL.revokeObjectURL(url);
    }
  }, [query.data]);

  return {
    qrUrl: objectUrl,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
