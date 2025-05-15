
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { useGraphContext } from '../context/GraphContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Initialize Supabase client with public keys
// These are public keys so it's safe to include them in the client
const supabaseUrl = 'https://iwhaelvfxmqpowmepbvr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aGFlbHZmeG1xcG93bWVwYnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU4ODM3NTUsImV4cCI6MjAzMTQ1OTc1NX0.moPKrKgThwInBtSaXu_xi86s7AN4RvyzBl64Ux0wa-g';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const NavBar: React.FC = () => {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');
  const [authOpen, setAuthOpen] = React.useState(false);
  const [saveGraphOpen, setSaveGraphOpen] = React.useState(false);
  const [graphName, setGraphName] = React.useState('');
  
  const { state } = useGraphContext();
  const { toast } = useToast();

  // Check for user session on component mount
  React.useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      setLoading(false);
      
      // Set up auth state change listener
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });
    };
    
    getSession();
  }, []);
  
  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setAuthOpen(false);
      toast({
        title: "Successfully signed in",
        description: "Welcome back!"
      });
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setAuthOpen(false);
      toast({
        title: "Account created",
        description: "Check your email for a confirmation link"
      });
    } catch (error: any) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully"
    });
  };
  
  const saveGraph = async () => {
    if (!graphName.trim()) {
      toast({
        title: "Graph name required",
        description: "Please enter a name for your graph",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('graphs')
        .insert({
          name: graphName,
          user_id: user.id,
          data: state.graph,
        });
      
      if (error) throw error;
      
      setSaveGraphOpen(false);
      setGraphName('');
      
      toast({
        title: "Graph saved",
        description: "Your graph has been saved successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error saving graph",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex items-center justify-between bg-gray-900 px-4 py-2">
      <h1 className="text-xl font-bold text-white">Graph Algorithm Visualizer</h1>
      
      <div className="flex gap-2">
        {user ? (
          <>
            <Button
              variant="outline"
              onClick={() => setSaveGraphOpen(true)}
              disabled={state.graph.nodes.length === 0}
            >
              Save Graph
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out ({user.email})
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => {
            setAuthMode('signin');
            setAuthOpen(true);
          }}>
            Sign In / Sign Up
          </Button>
        )}
      </div>
      
      {/* Authentication Dialog */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</DialogTitle>
            <DialogDescription>
              {authMode === 'signin' 
                ? 'Sign in to save and load your graphs' 
                : 'Create an account to save and load your graphs'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {authMode === 'signin' ? (
              <>
                <Button variant="outline" onClick={() => setAuthMode('signup')}>
                  Need an account?
                </Button>
                <Button onClick={handleSignIn}>Sign In</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setAuthMode('signin')}>
                  Already have an account?
                </Button>
                <Button onClick={handleSignUp}>Sign Up</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Save Graph Dialog */}
      <Dialog open={saveGraphOpen} onOpenChange={setSaveGraphOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Graph</DialogTitle>
            <DialogDescription>
              Give your graph a name to save it
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="graphName">Graph Name</Label>
              <Input
                id="graphName"
                value={graphName}
                onChange={(e) => setGraphName(e.target.value)}
                placeholder="My Graph"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={saveGraph}>Save Graph</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NavBar;
