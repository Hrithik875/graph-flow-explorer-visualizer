
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { useGraphContext } from '../context/GraphContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, LogIn, UserPlus } from 'lucide-react';

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
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
        console.log("Session data:", data);
        setLoading(false);
        
        // Set up auth state change listener
        supabase.auth.onAuthStateChange((_event, session) => {
          console.log("Auth state changed:", _event, session);
          setUser(session?.user || null);
        });
      } catch (error) {
        console.error("Error fetching session:", error);
        setLoading(false);
      }
    };
    
    getSession();
  }, []);
  
  const handleSignIn = async () => {
    try {
      console.log("Signing in with:", email, password);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log("Sign in response:", data, error);
      
      if (error) throw error;
      setAuthOpen(false);
      toast({
        title: "Successfully signed in",
        description: "Welcome back!"
      });
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Error signing in",
        description: error.message || "Failed to sign in",
        variant: "destructive"
      });
    }
  };
  
  const handleSignUp = async () => {
    try {
      console.log("Signing up with:", email, password);
      const { data, error } = await supabase.auth.signUp({ email, password });
      console.log("Sign up response:", data, error);
      
      if (error) throw error;
      setAuthOpen(false);
      toast({
        title: "Account created",
        description: "Check your email for a confirmation link"
      });
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: "Error signing up",
        description: error.message || "Failed to sign up",
        variant: "destructive"
      });
    }
  };
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully"
      });
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Error signing out",
        description: error.message || "Failed to sign out",
        variant: "destructive"
      });
    }
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
      console.error("Save graph error:", error);
      toast({
        title: "Error saving graph",
        description: error.message || "Failed to save graph",
        variant: "destructive"
      });
    }
  };

  // Function to handle save graph button click
  const handleSaveGraphClick = () => {
    if (user) {
      setSaveGraphOpen(true);
    } else {
      setAuthOpen(true);
      setAuthMode('signin');
      toast({
        title: "Authentication required",
        description: "Please sign in to save your graph",
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
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out ({user.email})
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="greenOutline" 
              onClick={() => {
                setAuthMode('signup');
                setAuthOpen(true);
              }}
              className="flex items-center gap-1"
            >
              <UserPlus size={16} />
              Sign Up
            </Button>
            <Button 
              variant="green"
              onClick={() => {
                setAuthMode('signin');
                setAuthOpen(true);
              }}
              className="flex items-center gap-1"
            >
              <LogIn size={16} />
              Log In
            </Button>
          </>
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
                <Button variant="green" onClick={handleSignIn}>Sign In</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setAuthMode('signin')}>
                  Already have an account?
                </Button>
                <Button variant="green" onClick={handleSignUp}>Sign Up</Button>
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
            <Button variant="green" onClick={saveGraph}>Save Graph</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Save Graph floating button */}
      <Button
        variant="green"
        onClick={handleSaveGraphClick}
        className="fixed bottom-6 right-6 rounded-full p-3 shadow-lg"
      >
        <Save className="mr-1" />
        Save Graph
      </Button>
    </div>
  );
};

export default NavBar;
