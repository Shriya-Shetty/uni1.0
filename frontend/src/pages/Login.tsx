import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  onLogin: (role: string) => void;
}

export default function Login({ onLogin }: Props) {
  const [role, setRole] = useState('admin');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Union Bank Grievance AI</h1>
            <p className="text-xs text-muted-foreground">Sign in to your account</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Employee ID / Email</Label>
            <Input id="email" placeholder="e.g. admin@unionbank.in" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label>Login as</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Branch Manager</SelectItem>
                <SelectItem value="user">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={() => onLogin(role)}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
