
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CompanyForm from "@/components/CompanyForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <Header />
      <Sidebar />
      
      <main className="pl-0 md:pl-64 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-green-800 mb-4">
              Company Analysis Dashboard
            </h2>
            <p className="text-lg text-green-600 max-w-2xl mx-auto">
              Submit your company information to get comprehensive analysis and insights 
              powered by our advanced Green Paint Remover technology.
            </p>
          </div>
          
          <div className="flex justify-center">
            <CompanyForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
