"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export function FirebaseStatus() {
  return (
    <Card className="border-orange-900/20 bg-orange-500/5 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <AlertCircle className="h-5 w-5" />
          Firebase Removed
        </CardTitle>
        <CardDescription>
          Firebase has been completely removed from this application
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-400 mb-2">System Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Authentication</span>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                Mock System
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                Local Storage
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Real-time Features</span>
              <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                Disabled
              </Badge>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-400 mb-2">Current Setup</h4>
          <div className="text-xs text-blue-300 space-y-1">
            <p>• Authentication: Mock system with localStorage</p>
            <p>• Quiz data: Static mock data</p>
            <p>• User sessions: Browser localStorage</p>
            <p>• Demo account: demo@mindrift.com / demo123</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}