import { useParams } from 'react-router-dom'

export default function Preview() {
  const { token } = useParams<{ token: string }>()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <span className="font-display text-4xl text-accent tracking-widest">
        /preview/{token}
      </span>
    </div>
  )
}
