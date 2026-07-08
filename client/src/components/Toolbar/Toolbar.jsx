export default function Toolbar() {

    return (

        <aside className="w-64 bg-white border-r shadow-md p-5">

            <h2 className="text-2xl font-bold mb-8">
                Tools
            </h2>

            <div className="space-y-4">

                <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg">
                    Brush
                </button>

                <button className="w-full bg-gray-200 py-3 rounded-lg">
                    Eraser
                </button>

                <button className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg">
                    Clear
                </button>

            </div>

        </aside>

    );

}