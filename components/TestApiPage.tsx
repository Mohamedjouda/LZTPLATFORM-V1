import React, { useState } from 'react';
import { testApiToken } from '../services/lztService';
import { Loader2, CheckCircle2, AlertTriangle } from './Icons';

interface TestResult {
    success: boolean;
    message: string;
}

const TestApiPage: React.FC = () => {
    const [token, setToken] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);

    const handleTestToken = async () => {
        if (!token) {
            setResult({ success: false, message: 'Please enter an API token to test.' });
            return;
        }
        setIsTesting(true);
        setResult(null);
        const testResult = await testApiToken(token);
        if (testResult.success) {
            setResult({ success: true, message: 'Success! The API token is valid and working correctly.' });
        } else {
            setResult({ success: false, message: `Test failed: ${testResult.error}` });
        }
        setIsTesting(false);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">LZT Market API Tester</h1>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                    Use this page to quickly test any LZT Market API token. This is useful for verifying a new token before saving it in the settings, or for general troubleshooting.
                </p>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            LZT Market API Token
                        </label>
                        <input
                            type="password"
                            id="apiToken"
                            name="apiToken"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Paste your LZT Market Bearer Token here"
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 p-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div className="text-right">
                         <button
                            onClick={handleTestToken}
                            disabled={isTesting}
                            className="inline-flex justify-center items-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
                        >
                            {isTesting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                            {isTesting ? 'Testing...' : 'Test Token'}
                        </button>
                    </div>
                </div>

                {result && (
                     <div className={`mt-6 p-4 rounded-lg flex items-start space-x-3 ${result.success ? 'bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500' : 'bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500'}`}>
                        <div className="flex-shrink-0">
                            {result.success ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <AlertTriangle className="h-6 w-6 text-red-500" />}
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-lg font-bold ${result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                                {result.success ? 'Validation Successful' : 'Validation Failed'}
                            </h3>
                            <p className={`mt-1 text-sm ${result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {result.message}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestApiPage;
