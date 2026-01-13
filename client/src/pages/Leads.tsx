import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { useLeads } from "@/hooks/use-resources";
import { Badge } from "@/components/ui/badge";
import { Inbox, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

export default function Leads() {
  const { data: leads, isLoading } = useLeads();

  return (
    <AppLayout>
      <PageHeader
        title="Leads"
        description="Track responses and interested prospects."
      />

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Gmail Thread</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  Loading leads...
                </TableCell>
              </TableRow>
            ) : leads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">No leads yet</p>
                    <p className="text-sm text-muted-foreground">
                      Replies classified as leads will appear here.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leads?.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Badge variant={lead.status === 'new' ? 'default' : 'secondary'}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium capitalize">{lead.classification || 'Unclassified'}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.createdAt ? formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true }) : '-'}
                  </TableCell>
                  <TableCell>
                    <a href={`#thread-${lead.gmailThreadId}`} className="flex items-center gap-1 text-primary hover:underline text-sm">
                      View Thread <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
