import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

type Report = {
  id: string;
  reporter: string;
  reported: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
};

const INITIAL_REPORTS: Report[] = [
  { id: '1', reporter: 'User #101', reported: 'User #205', reason: 'Fake profile', status: 'pending' },
  { id: '2', reporter: 'User #309', reported: 'User #142', reason: 'Inappropriate content', status: 'resolved' },
  { id: '3', reporter: 'User #87', reported: 'User #315', reason: 'Harassment', status: 'pending' },
  { id: '4', reporter: 'User #220', reported: 'User #180', reason: 'Spam', status: 'pending' },
  { id: '5', reporter: 'User #445', reported: 'User #390', reason: 'Scam/fraud', status: 'dismissed' },
];

export default function Moderation() {
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);

  const resolve = (id: string) => setReports(r => r.map(x => x.id === id ? { ...x, status: 'resolved' } : x));
  const dismiss = (id: string) => setReports(r => r.map(x => x.id === id ? { ...x, status: 'dismissed' } : x));

  const pending = reports.filter(r => r.status === 'pending').length;
  const resolved = reports.filter(r => r.status === 'resolved').length;
  const dismissed = reports.filter(r => r.status === 'dismissed').length;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Moderation</h1>
          <p className="text-muted-foreground text-sm">Review and action user reports</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{resolved}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-2xl font-bold">{dismissed}</p>
                <p className="text-sm text-muted-foreground">Dismissed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Reporter</th>
                  <th className="text-left p-3 font-medium">Reported</th>
                  <th className="text-left p-3 font-medium">Reason</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="p-3 whitespace-nowrap">{r.reporter}</td>
                    <td className="p-3 whitespace-nowrap">{r.reported}</td>
                    <td className="p-3">{r.reason}</td>
                    <td className="p-3">
                      {r.status === 'pending' && <Badge className="bg-amber-100 text-amber-600 border-0">Pending</Badge>}
                      {r.status === 'resolved' && <Badge className="bg-primary/10 text-primary border-0">Resolved</Badge>}
                      {r.status === 'dismissed' && <Badge className="bg-gray-100 text-gray-600 border-0">Dismissed</Badge>}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={r.status !== 'pending'}
                          onClick={() => resolve(r.id)}
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          disabled={r.status !== 'pending'}
                          onClick={() => dismiss(r.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
