"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowBigUp,
  MessageCircle,
  ArrowLeft,
  MoreHorizontal,
  Trash2,
  Edit2,
  Reply,
  User,
} from "lucide-react";
import { cn, timeAgo, formatCategory } from "@/lib/utils";
import Link from "next/link";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: postData, isLoading: postLoading } =
    trpc.posts.getById.useQuery({ id });
  const { data: commentsData, isLoading: commentsLoading } =
    trpc.comments.byPost.useQuery({ postId: id });

  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const toggleUpvote = trpc.posts.toggleUpvote.useMutation({
    onSuccess: () => {
      utils.posts.getById.invalidate({ id });
    },
  });

  const addComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentText("");
      setReplyText("");
      setReplyingTo(null);
      utils.comments.byPost.invalidate({ postId: id });
      utils.posts.getById.invalidate({ id });
    },
  });

  const deleteComment = trpc.comments.delete.useMutation({
    onSuccess: () => {
      utils.comments.byPost.invalidate({ postId: id });
      utils.posts.getById.invalidate({ id });
    },
  });

  const deletePost = trpc.posts.delete.useMutation({
    onSuccess: () => {
      router.push("/community");
    },
  });

  if (postLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-6" />
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Post not found
        </h1>
        <p className="text-gray-600 mb-6">
          This post may have been removed.
        </p>
        <Link
          href="/community"
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700"
        >
          Back to Community
        </Link>
      </div>
    );
  }

  const { post, author, hasUpvoted } = postData;
  const isOwner = session?.user?.id === post.authorId;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Community
      </Link>

      {/* Post */}
      <article className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {/* Author & meta */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${author.id}`}>
              {author.image ? (
                <img
                  src={author.image}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-semibold">
                    {(author.nickname ?? author.name)?.charAt(0) ?? "?"}
                  </span>
                </div>
              )}
            </Link>
            <div>
              <Link
                href={`/profile/${author.id}`}
                className="text-sm font-medium text-gray-900 hover:text-emerald-600"
              >
                {author.nickname ?? author.name ?? "Anonymous"}
              </Link>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{timeAgo(post.createdAt)}</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                  {formatCategory(post.category)}
                </span>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <Link
                    href={`/community/edit/${post.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowMenu(false)}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Post
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm("Delete this post?")) {
                        deletePost.mutate({ id: post.id });
                      }
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h1>

        {/* Body */}
        <div className="text-sm text-gray-700 whitespace-pre-wrap mb-4 leading-relaxed">
          {post.body}
        </div>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {post.images.map((img, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-lg overflow-hidden bg-gray-100",
                  post.images!.length === 1 && "col-span-2"
                )}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-48 object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => {
              if (!session) return;
              toggleUpvote.mutate({ postId: post.id });
            }}
            disabled={!session}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              hasUpvoted
                ? "text-emerald-600 bg-emerald-50"
                : "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
            )}
          >
            <ArrowBigUp
              className={cn("w-5 h-5", hasUpvoted && "fill-emerald-600")}
            />
            {post.upvoteCount ?? 0}
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MessageCircle className="w-4 h-4" />
            {post.commentCount ?? 0} comments
          </div>
        </div>
      </article>

      {/* Add comment */}
      {session && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={() => {
                if (!commentText.trim()) return;
                addComment.mutate({
                  postId: id,
                  body: commentText.trim(),
                });
              }}
              disabled={!commentText.trim() || addComment.isPending}
              className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {addComment.isPending ? "Posting..." : "Comment"}
            </button>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-1">
        {commentsLoading && (
          <div className="animate-pulse space-y-4 p-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-24" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {commentsData && commentsData.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}

        {commentsData?.map((node) => (
          <CommentNode
            key={node.comment.id}
            node={node}
            depth={0}
            postId={id}
            session={session}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            replyText={replyText}
            setReplyText={setReplyText}
            addComment={addComment}
            deleteComment={deleteComment}
          />
        ))}
      </div>
    </div>
  );
}

// Recursive comment component for threading
function CommentNode({
  node,
  depth,
  postId,
  session,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  addComment,
  deleteComment,
}: {
  node: {
    comment: {
      id: string;
      postId: string;
      authorId: string;
      parentId: string | null;
      body: string;
      upvoteCount: number | null;
      createdAt: Date;
    };
    author: { id: string; name: string | null; nickname: string | null; image: string | null };
    replies: any[];
  };
  depth: number;
  postId: string;
  session: any;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (t: string) => void;
  addComment: any;
  deleteComment: any;
}) {
  const isOwner = session?.user?.id === node.comment.authorId;
  const isReplying = replyingTo === node.comment.id;
  const maxDepth = 4;

  return (
    <div
      className={cn(
        "border-l-2 border-gray-100",
        depth > 0 && "ml-4 sm:ml-6"
      )}
    >
      <div className="py-3 px-4">
        {/* Comment header */}
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/profile/${node.author.id}`} className="shrink-0">
            {node.author.image ? (
              <img
                src={node.author.image}
                alt=""
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-700 text-[10px] font-semibold">
                  {(node.author.nickname ?? node.author.name)?.charAt(0) ?? "?"}
                </span>
              </div>
            )}
          </Link>
          <Link
            href={`/profile/${node.author.id}`}
            className="text-xs font-medium text-gray-700 hover:text-emerald-600"
          >
            {node.author.nickname ?? node.author.name ?? "Anonymous"}
          </Link>
          <span className="text-xs text-gray-400">
            {timeAgo(node.comment.createdAt)}
          </span>
        </div>

        {/* Comment body */}
        <p className="text-sm text-gray-700 whitespace-pre-wrap ml-8 mb-1.5">
          {node.comment.body}
        </p>

        {/* Comment actions */}
        <div className="flex items-center gap-3 ml-8">
          {session && depth < maxDepth && (
            <button
              onClick={() =>
                setReplyingTo(isReplying ? null : node.comment.id)
              }
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => deleteComment.mutate({ id: node.comment.id })}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
        </div>

        {/* Reply form */}
        {isReplying && session && (
          <div className="ml-8 mt-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${node.author.nickname ?? node.author.name ?? "Anonymous"}...`}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-1.5">
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText("");
                }}
                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!replyText.trim()) return;
                  addComment.mutate({
                    postId,
                    body: replyText.trim(),
                    parentId: node.comment.id,
                  });
                }}
                disabled={!replyText.trim() || addComment.isPending}
                className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full hover:bg-emerald-700 disabled:opacity-50"
              >
                {addComment.isPending ? "Posting..." : "Reply"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {node.replies.length > 0 && (
        <div>
          {node.replies.map((reply: any) => (
            <CommentNode
              key={reply.comment.id}
              node={reply}
              depth={depth + 1}
              postId={postId}
              session={session}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              addComment={addComment}
              deleteComment={deleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
