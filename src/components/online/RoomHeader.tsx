'use client'
import React from 'react'

type Props = {
  code: string
  state: string
}
export default function RoomHeader({ code, state }: Props) {
  return (
    <>
      <h1 className="text-2xl font-bold text-center">Room {code}</h1>
      <p className="text-center text-gray-500">State: {state}</p>
    </>
  )
}
