import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const { t } = useTranslation();

  // Define styles based on status
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "approved":
      case "certified":
        return "bg-success bg-opacity-10 text-success";
      case "pending":
        return "bg-warning bg-opacity-10 text-warning";
      case "under_review":
      case "review":
        return "bg-primary-100 text-primary-700";
      case "revoked":
      case "rejected":
      case "expired":
        return "bg-destructive bg-opacity-10 text-destructive";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get translated status text
  const getStatusText = (status: string) => {
    return t(`certificate.statuses.${status.toLowerCase()}`);
  };

  return (
    <Badge
      className={cn(
        "px-3 py-1 rounded-full font-medium",
        getStatusStyles(status),
        className
      )}
    >
      {getStatusText(status)}
    </Badge>
  );
};

export default StatusBadge;
