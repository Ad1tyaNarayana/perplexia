import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  LogOut,
  PanelLeft,
} from "lucide-react";
import { ChatSession } from "../types";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useAuth } from "../context/AuthContext";
import { useClerk } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";

interface SidebarProps {
  sessions: ChatSession[];
  onCreateSession: () => void;
  onDeleteSession: (id: number) => void;
  onRenameSession: (id: number, name: string) => void;
  currentSessionId?: number;
}

export function Sidebar({
  sessions,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  currentSessionId,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const { isAuthenticated } = useAuth();
  const { signOut } = useClerk();

  const handleRename = (id: number) => {
    if (newName.trim()) {
      onRenameSession(id, newName);
      setEditingSession(null);
      setNewName("");
    }
  };

  const startEditing = (session: ChatSession) => {
    setEditingSession(session.id);
    setNewName(session.name);
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="flex lg:hidden absolute top-1 left-0 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <PanelLeft />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-full flex-col">
              <SidebarContent
                sessions={sessions}
                onCreateSession={onCreateSession}
                onDeleteSession={onDeleteSession}
                editingSession={editingSession}
                setEditingSession={setEditingSession}
                newName={newName}
                setNewName={setNewName}
                startEditing={startEditing}
                handleRename={handleRename}
                currentSessionId={currentSessionId}
                setIsOpen={setIsOpen}
                isAuthenticated={isAuthenticated}
                signOut={signOut}
                mobile={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col pl-1">
        <SidebarContent
          sessions={sessions}
          onCreateSession={onCreateSession}
          onDeleteSession={onDeleteSession}
          editingSession={editingSession}
          setEditingSession={setEditingSession}
          newName={newName}
          setNewName={setNewName}
          startEditing={startEditing}
          handleRename={handleRename}
          currentSessionId={currentSessionId}
          isAuthenticated={isAuthenticated}
          signOut={signOut}
          mobile={false}
        />
      </div>
    </>
  );
}

interface SidebarContentProps {
  sessions: ChatSession[];
  onCreateSession: () => void;
  onDeleteSession: (id: number) => void;
  editingSession: number | null;
  setEditingSession: (id: number | null) => void;
  newName: string;
  setNewName: (name: string) => void;
  startEditing: (session: ChatSession) => void;
  handleRename: (id: number) => void;
  currentSessionId?: number;
  setIsOpen?: (open: boolean) => void;
  isAuthenticated: boolean;
  signOut: () => void;
  mobile: boolean;
}

function SidebarContent({
  sessions,
  onCreateSession,
  onDeleteSession,
  editingSession,
  setEditingSession,
  newName,
  setNewName,
  startEditing,
  handleRename,
  currentSessionId,
  setIsOpen,
  isAuthenticated,
  signOut,
  mobile,
}: SidebarContentProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, sessionId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (sessionToDelete !== null) {
      onDeleteSession(sessionToDelete);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  return (
    <div
      className={`flex flex-col overflow-y-auto text-slate-100 pr-4 pl-4 pt-[10%] pb-[10%] shadow-xs border-none ${
        setIsOpen ? "h-full" : ""
      } ${mobile ? "" : "h-full"} `}
      style={{
        backgroundImage: `url(${window.location.origin}/blue_sidebar_GB.png)`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="mb-4 flex items-center justify-between px-2">
        <h2 className="text-3xl font-semibold">Perplexia</h2>
        <div className="flex gap-2">
          <Button
            variant="brown_GB"
            size="icon"
            onClick={() => {
              onCreateSession();
              if (setIsOpen) setIsOpen(false);
            }}
            className="hover:bg-neutral-700 hover:cursor-pointer"
          >
            <img
              src={`${window.location.origin}/plus.svg`}
              className="h-8 w-8"
            />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        {isAuthenticated ? (
          sessions.length > 0 ? (
            sessions.map((session) => (
              <div key={session.id} className="relative group">
                {editingSession === session.id ? (
                  <div className="flex items-center space-x-1 p-1">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(session.id);
                        if (e.key === "Escape") setEditingSession(null);
                      }}
                      autoFocus
                      className="h-8"
                    />
                    <Button
                      size="sm"
                      className="ml-2"
                      variant="brown_rect_GB"
                      onClick={() => handleRename(session.id)}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <Link
                    to="/chat/$sessionId"
                    params={{ sessionId: session.id.toString() }}
                    className={`flex items-center space-x-2 rounded-md px-3 my-2 py-2 text-sm hover:bg-[#5898c6] hover:cursor-pointer
                      ${
                        currentSessionId === session.id
                          ? "text-accent-foreground bg-[#5898c6]"
                          : "hover:bg-accent/50"
                      }`}
                    onClick={() => {
                      if (setIsOpen) setIsOpen(false);
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="flex-1 truncate">{session.name}</span>
                    <div
                      className={`flex space-x-1 ${
                        mobile
                          ? ""
                          : "opacity-0 group-hover:opacity-100 transition-opacity"
                      }`}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-emerald-800 hover:cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startEditing(session);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-red-700 hover:cursor-pointer"
                        onClick={(e) => handleDeleteClick(e, session.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Dialog
                      open={deleteDialogOpen}
                      onOpenChange={setDeleteDialogOpen}
                    >
                      <DialogContent
                        className=" text-slate-800 border-none"
                        style={{
                          backgroundImage: `url(${window.location.origin}/brown_GB.png)`,
                          backgroundSize: "100% 100%",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle>
                            <span className="drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.4)]">
                              Delete {session.name}
                            </span>
                          </DialogTitle>
                          <DialogDescription>
                            <span className="drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.4)]">
                              Are you sure you want to delete this chat? This
                              action cannot be undone.
                            </span>
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </Link>
                )}
              </div>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No conversations yet. Start a new chat!
            </p>
          )
        ) : (
          <p className=""></p>
        )}
      </div>

      <div className="mt-auto mb-4 flex justify-center">
        {isAuthenticated ? (
          <Button
            variant="brown_rect_GB"
            className=" hover:bg-neutral-700 hover:cursor-pointer"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.6)]">
              Sign Out
            </span>
          </Button>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="mb-4">Sign in to see your conversations</p>
            <div className="flex flex-row gap-2">
              <Link
                to="/login"
                className="w-full"
                onClick={() => {
                  if (setIsOpen) setIsOpen(false);
                }}
              >
                <Button
                  variant="brown_rect_GB"
                  className="w-full hover:bg-neutral-700 hover:cursor-pointer text-lg"
                >
                  <span className="drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.6)]">
                    Login In
                  </span>
                </Button>
              </Link>
              <Link
                to="/register"
                className="w-full"
                onClick={() => {
                  if (setIsOpen) setIsOpen(false);
                }}
              >
                <Button
                  variant="brown_rect_GB"
                  className="w-full hover:bg-neutral-700 hover:cursor-pointer text-lg"
                >
                  <span className="drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.6)]">
                    Sign Up
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
