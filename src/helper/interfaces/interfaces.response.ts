import { Gender } from "@prisma/client";

interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  token: string;
}


interface UpdateProfileResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  token: string;
}

interface ProfileResponse {
  id: number;
  name: string;
  email: string;
  role: string;
}


interface IUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string
  avatar?: string
  bio?: string
  createdAt?: Date
  gender?: Gender
}


interface IMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  deliveredTo: string[];
  readBy: string[];
  mediaUrl?: string;
  mediaType?: string;
}
interface FlutterUser {
  id: string;
  name: string;
  email: string;
}

interface IChat {
  id: string;
  name: string;
  isGroup: boolean;
  users: FlutterUser[];
  lastMessage: IMessage | null;
}

interface IGroup {
  id: string;
  name: string;
  teacherId: string;
  subjectId: string;
  capacity: string;
  studentIds: string[];
  status: "complete" | "active" | "inactive"; // restrict to enum-like values
  createdAt: Date;
}


interface ISubject {
  id: string;
  name: string;
  description: string;
  createdBy: FlutterUser;
  createdAt: Date;
}

interface IMaterial {
  id: string;
  name: string;
  type: string; // restrict to specific values
  groups: Array<{ id: string; name: string }>;
  subjectId: string;
  description: string;
  fileUrl: string;
  createdBy: FlutterUser;
  createdAt: Date;
}

export {
  LoginResponse, RegisterResponse, UpdateProfileResponse, ProfileResponse,
  IUser, IMessage, FlutterUser, IChat, IGroup, ISubject, IMaterial
};