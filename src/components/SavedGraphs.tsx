
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGraphContext } from '../context/GraphContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const SavedGraphs: React.FC = () => {
  const [savedGraphs, setSavedGraphs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const { dispatch } = useGraphContext();
  const { toast } = useToast();
  
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchSavedGraphs(currentUser.id);
      } else {
        setLoading(false);
      }
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const newUser = session?.user || null;
        setUser(newUser);
        
        if (newUser) {
          fetchSavedGraphs(newUser.id);
        } else {
          setSavedGraphs([]);
          setLoading(false);
        }
      });
      
      return () => {
        subscription.unsubscribe();
      };
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
      
      console.log("Fetched graphs:", data);
      setSavedGraphs(data || []);
    } catch (error: any) {
      console.error("Error fetching graphs:", error);
      toast({
        title: "Error loading graphs",
        description: error.message || "Failed to load your saved graphs",
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
      console.error("Error loading graph:", error);
      toast({
        title: "Error loading graph",
        description: "The graph data may be corrupted",
        variant: "destructive"
      });
    }
  };
  
  const deleteGraph = async (id: string) => {
    try {
      setLoading(true);
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
      console.error("Error deleting graph:", error);
      toast({
        title: "Error deleting graph",
        description: error.message || "Failed to delete the graph",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
