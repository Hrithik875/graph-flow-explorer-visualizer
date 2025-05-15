
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useGraphContext } from '../context/GraphContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

// Initialize Supabase client with public keys
const supabaseUrl = 'https://iwhaelvfxmqpowmepbvr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aGFlbHZmeG1xcG93bWVwYnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU4ODM3NTUsImV4cCI6MjAzMTQ1OTc1NX0.moPKrKgThwInBtSaXu_xi86s7AN4RvyzBl64Ux0wa-g';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SavedGraphs: React.FC = () => {
  const [savedGraphs, setSavedGraphs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const { dispatch } = useGraphContext();
  const { toast } = useToast();
  
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        fetchSavedGraphs(data.session.user.id);
      } else {
        setLoading(false);
      }
      
      // Set up auth state change listener
      supabase.auth.onAuthStateChange((_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        if (currentUser) {
          fetchSavedGraphs(currentUser.id);
        } else {
          setSavedGraphs([]);
          setLoading(false);
        }
      });
    };
    
    getSession();
  }, []);
  
  const fetchSavedGraphs = async (userId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('graphs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSavedGraphs(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading graphs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadGraph = (graph: any) => {
    try {
      dispatch({ type: 'RESET_GRAPH_STATUS' });
      
      // Replace the current graph with the saved one
      const graphData = graph.data;
      
      // Set nodes and edges directly
      dispatch({ 
        type: 'LOAD_SAVED_GRAPH', 
        graph: graphData 
      });
      
      toast({
        title: "Graph loaded",
        description: `Successfully loaded "${graph.name}"`
      });
    } catch (error: any) {
      toast({
        title: "Error loading graph",
        description: "The graph data may be corrupted",
        variant: "destructive"
      });
    }
  };
  
  const deleteGraph = async (id: string) => {
    try {
      const { error } = await supabase
        .from('graphs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the list
      setSavedGraphs(savedGraphs.filter(graph => graph.id !== id));
      
      toast({
        title: "Graph deleted",
        description: "The graph has been deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error deleting graph",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm text-gray-400">Sign in to save and load graphs</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm text-gray-400">Loading saved graphs...</p>
      </div>
    );
  }
  
  if (savedGraphs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm text-gray-400">No saved graphs yet</p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {savedGraphs.map((graph) => (
          <div 
            key={graph.id}
            className="flex flex-col gap-2 p-2 bg-gray-700 rounded-md"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-white truncate">{graph.name}</span>
              <span className="text-xs text-gray-400">
                {new Date(graph.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1"
                onClick={() => loadGraph(graph)}
              >
                Load
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => deleteGraph(graph.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default SavedGraphs;
