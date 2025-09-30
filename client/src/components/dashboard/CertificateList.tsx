import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";

const CertificateList = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [revokeReason, setRevokeReason] = useState("");

  // Fetch certificates with pagination and filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/certificates', page, statusFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/certificates?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch certificates");
      return response.json();
    }
  });

  // Revoke certificate mutation
  const revokeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number, reason: string }) => {
      const response = await fetch(`/api/admin/certificates/${id}/revoke`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error("Failed to revoke certificate");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certificate Revoked",
        description: "The certificate has been revoked successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/certificates'] });
      setRevokeDialogOpen(false);
      setRevokeReason("");
      setSelectedCertificate(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleRevoke = () => {
    if (!selectedCertificate || !revokeReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for revocation.",
        variant: "destructive"
      });
      return;
    }
    revokeMutation.mutate({ id: selectedCertificate.id, reason: revokeReason });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Certificates</h2>
            <p className="text-gray-500">Failed to load certificate data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const certificates = data?.certificates || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificate Management</CardTitle>
        <CardDescription>View and manage all halal certificates</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by certificate number or store name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Certificate Table */}
        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No certificates found.</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate Number</TableHead>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert: any) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.certificateNumber}</TableCell>
                      <TableCell>{cert.storeName}</TableCell>
                      <TableCell>
                        {cert.storeCity}, {cert.storeState}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={cert.status} />
                      </TableCell>
                      <TableCell>
                        {cert.issuedDate ? format(new Date(cert.issuedDate), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {cert.expiryDate ? format(new Date(cert.expiryDate), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/verify/${cert.certificateNumber}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          {cert.status === 'active' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedCertificate(cert);
                                setRevokeDialogOpen(true);
                              }}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {page} • {certificates.length} certificates
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={certificates.length < 20}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Revoke Certificate
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke certificate {selectedCertificate?.certificateNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">Reason for Revocation</label>
            <Textarea
              placeholder="Provide a detailed reason for revoking this certificate..."
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRevokeDialogOpen(false);
                setRevokeReason("");
                setSelectedCertificate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revokeMutation.isPending || !revokeReason.trim()}
            >
              {revokeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Revoke Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CertificateList;