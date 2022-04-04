import { Schema, Document, Types, model } from 'mongoose'

export interface EventErrorDoc extends Document {
  _id: Types.ObjectId
  operationId: Types.ObjectId
  parentId: Types.ObjectId
  durableName: string
  clientGroup: string
  parentSubject: string
  eventHandlerOrder: number
  errorCount: number
  error: {
    message?: string
    stack?: string
    createdAt: Date
  }[]
  isResolved: Boolean
  createdAt: Date
  updatedAt: Date
}

const EventErrorSchema = new Schema(
  {
    operationId: { type: Types.ObjectId, required: true },
    parentId: { type: Types.ObjectId, required: true },
    durableName: { type: String, required: true },
    clientGroup: { type: String, required: true },
    parentSubject: { type: String, required: true },
    eventHandlerOrder: { type: Number, required: true },
    errorCount: { type: Number, required: true },
    error: [
      {
        message: String,
        stack: String,
        createdAt: { type: Date, required: true },
      },
    ],
    isResolved: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
)

export const EventError = model<EventErrorDoc>('EventError', EventErrorSchema)

export const createEventError = async (data: {
  operationId: Types.ObjectId
  parentId: Types.ObjectId
  durableName: string
  clientGroup: string
  subject: string
  eventHandlerOrder: number
  error: {
    message?: string
    stack?: string
  }
}) => {
  const error = { message: JSON.stringify(data.error.message), stack: data.error.stack }
  const eventError = await EventError.findOneAndUpdate(
    {
      operationId: data.operationId,
      parentId: data.parentId,
      durableName: data.durableName,
    },
    {
      $push: { error },
      $inc: { errorCount: 1 },
      isResolved: false,
    },
    { new: true }
  ).exec()
  if (eventError) return eventError.toObject()

  const newEventError = await new EventError({
    operationId: data.operationId,
    parentId: data.parentId,
    durableName: data.durableName,
    clientGroup: data.clientGroup,
    parentSubject: data.subject,
    eventHandlerOrder: data.eventHandlerOrder,
    errorCount: 1,
    error: [{ ...error, createdAt: new Date() }],
    isResolved: false,
  }).save()

  return newEventError
}
