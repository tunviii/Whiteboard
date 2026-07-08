export default function UserList({ users }) {

    return (

        <aside className="w-64 bg-white border-l shadow-md p-5">

            <h2 className="text-2xl font-bold mb-6">
                Users
            </h2>

            <div className="space-y-3">

                {users.map(user => (

                    <div
                        key={user.socketId}
                        className="flex items-center gap-3 bg-slate-100 rounded-lg p-3"
                    >

                        <div className="w-3 h-3 rounded-full bg-green-500"/>

                        <span>{user.username}</span>

                    </div>

                ))}

            </div>

        </aside>

    );

}