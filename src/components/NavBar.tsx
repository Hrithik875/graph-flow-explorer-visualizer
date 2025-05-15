import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGraphContext } from '../context/GraphContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, LogIn, UserPlus } from 'lucide-react';

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
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error);
          throw error;
        }
        
        console.log("Session data:", data);
        setUser(data.session?.user || null);
        setLoading(false);
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log("Auth state changed:", _event, session);
          setUser(session?.user || null);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error in auth setup:", error);
        setLoading(false);
      }
    };
    
    getSession();
  }, []);
  
  const handleSignIn = async () => {
    try {
      setLoading(true);
      console.log("Signing in with:", email, password);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
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
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignUp = async () => {
    try {
      setLoading(true);
      console.log("Signing up with:", email, password);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
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
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
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
    } finally {
      setLoading(false);
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
      setLoading(true);
      const { error } = await supabase
        .from('graphs')
        .insert({
          name: graphName,
          user_id: user.id,
          data: JSON.parse(JSON.stringify(state.graph)), // Ensure plain JSON
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
    } finally {
      setLoading(false);
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
    <>
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png" // or import and use {logo} if in src/assets
            alt="Logo"
            className="h-10 w-10 object-contain"
            style={{ borderRadius: 8 }}
          />
          <h1 className="text-xl font-bold text-white whitespace-nowrap">
            Graph Algorithm Visualizer
          </h1>
        </div>

        {/* Center: Empty */}
        <div className="flex-1" />

        {/* Right: Auth buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="outline" onClick={handleSignOut} disabled={loading}>
              {loading ? 'Processing...' : `Sign Out (${user.email})`}
            </Button>
          ) : (
            <>
              <Button
                variant="greenOutline"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthOpen(true);
                }}
                className="flex items-center gap-1"
                disabled={loading}
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
                disabled={loading}
              >
                <LogIn size={16} />
                Log In
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Save Graph floating button */}
      <Button
        variant="green"
        onClick={handleSaveGraphClick}
        className="fixed bottom-6 right-6 rounded-full p-3 shadow-lg z-50"
        disabled={loading}
      >
        <Save className="mr-1" />
        Save Graph
      </Button>

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
            <div className="flex items-center my-2">
              <div className="flex-grow border-t border-gray-300" />
              <span className="mx-2 text-gray-500 text-xs">or</span>
              <div className="flex-grow border-t border-gray-300" />
            </div>
            <Button
              variant="outline"
              className="w-full mb-2 flex items-center gap-2"
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
              disabled={loading}
            >
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" className="h-5 w-5" />
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
              disabled={loading}
            >
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" alt="GitHub" className="h-5 w-5" />
              Continue with GitHub
            </Button>
          </div>
          
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {authMode === 'signin' ? (
              <>
                <Button variant="outline" onClick={() => setAuthMode('signup')}>
                  Need an account?
                </Button>
                <Button variant="green" onClick={handleSignIn} disabled={loading}>
                  {loading ? 'Processing...' : 'Sign In'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setAuthMode('signin')}>
                  Already have an account?
                </Button>
                <Button variant="green" onClick={handleSignUp} disabled={loading}>
                  {loading ? 'Processing...' : 'Sign Up'}
                </Button>
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
            <Button variant="green" onClick={saveGraph} disabled={loading}>
              {loading ? 'Saving...' : 'Save Graph'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NavBar;
