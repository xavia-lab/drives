import { useApiUrl } from "@refinedev/core";
import { useQuery } from "@tanstack/react-query";
import { BinaryService } from "@providers/binary-data-provider";
import { useEffect, useState } from "react";

export const useMedia = (fileId?: string) => {
  const apiUrl = useApiUrl();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["media", fileId],
    queryFn: () => BinaryService.getBlob(`${apiUrl}/files/${fileId}`),
    enabled: !!fileId,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (query.data) {
      // Store the mime type from the blob
      setMimeType(query.data.type);

      const url = URL.createObjectURL(query.data);
      setObjectUrl(url);

      return () => URL.revokeObjectURL(url);
    }
  }, [query.data]);

  return {
    url: objectUrl,
    mimeType,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
