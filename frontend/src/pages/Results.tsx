
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { LoaderCircle } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Recharts components for visualization
import { 
  PieChart, 
  Pie, 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell, 
  ResponsiveContainer 
} from "recharts";

// Dummy data for the charts
const pieData = [
  { name: "Website Content", value: 45 },
  { name: "Documents", value: 30 },
  { name: "News Sources", value: 25 }
];

const barData = [
  { name: "Misleading Claims", count: 12 },
  { name: "Vague Statements", count: 8 },
  { name: "False Certifications", count: 3 },
  { name: "Selective Disclosure", count: 7 },
  { name: "Hidden Trade-offs", count: 5 }
];

const COLORS = ["#4ade80", "#22c55e", "#16a34a", "#15803d"];

const Results = () => {
  const [loading, setLoading] = useState(true);
  
  // Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white">
        <LoaderCircle className="h-12 w-12 animate-spin text-green-600 mb-4" />
        <p className="text-lg text-green-700">Analyzing company data...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <Header />
      <Sidebar />
      
      <main className="pl-0 md:pl-64 pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-3xl font-bold text-green-800 mb-8">Analysis Results</h2>
          
          {/* Summary Panel */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Overview of the greenwashing analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Greenwashing detected</h3>
                  <p className="text-2xl font-bold text-red-500">Yes</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Confidence score</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">87%</span>
                      <span className="text-gray-500">High Confidence</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Data Visualizations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Source Breakdown</CardTitle>
                <CardDescription>Distribution of greenwashing by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Issue Categories</CardTitle>
                <CardDescription>Frequency of detected issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Detailed Report */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Findings</CardTitle>
              <CardDescription>Comprehensive analysis report</CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h3>Executive Summary</h3>
              <p>Our analysis has identified several instances of potential greenwashing in the company's communications. The most concerning areas involve misleading environmental claims and vague sustainability commitments without supporting evidence.</p>
              
              <h3>Key Findings</h3>
              <ul>
                <li><strong>Misleading Claims:</strong> The company website contains statements about "carbon neutrality" without providing verification or methodology details.</li>
                <li><strong>Vague Commitments:</strong> Multiple references to "eco-friendly processes" without specific details or metrics.</li>
                <li><strong>Selective Disclosure:</strong> Environmental achievements are highlighted while problematic areas are omitted.</li>
              </ul>
              
              <h3>Recommended Actions</h3>
              <ol>
                <li>Provide transparent methodology for environmental claims</li>
                <li>Establish measurable sustainability targets</li>
                <li>Disclose both achievements and challenges in sustainability reporting</li>
                <li>Obtain third-party verification for environmental claims</li>
              </ol>
              
              <blockquote>
                <p>"The analysis suggests a pattern of emphasizing positive environmental actions while minimizing or concealing practices that contradict sustainability claims."</p>
              </blockquote>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Results;
