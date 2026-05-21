import { Request, Response } from 'express';
import prisma from '../config/prisma';
import * as CommentModel from '../models/CommentModel';
import * as LogModel from '../models/LogModel';
import { getLocalCommentImageUrls, removeLocalCommentImages } from '../config/upload';

export const addComment = async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.redirect(`/product-details/${req.params.id}?error=Faça login para comentar`);
  }

  const productId = parseInt(req.params.id);
  const { content } = req.body;

  if (!content || content.trim() === '') {
    if (req.files) await removeLocalCommentImages(req.files as Express.Multer.File[]);
    return res.redirect(`/product-details/${productId}?error=Comentário não pode estar vazio`);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { person_id: req.session.user.id }
    });

    if (!user) {
      if (req.files) await removeLocalCommentImages(req.files as Express.Multer.File[]);
      return res.redirect(`/product-details/${productId}?error=Usuário não encontrado`);
    }

    const comment = await CommentModel.createComment({
      content: content.trim(),
      user_id: user.id,
      product_id: productId
    });

    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const images = getLocalCommentImageUrls(files);
      for (const img of images) {
        await prisma.commentImage.create({
          data: {
            imageUrl: img.imageUrl,
            imageStorage: img.imageStorage,
            comment_id: comment.id
          }
        });
      }
    }

    await LogModel.createLog({
      user_id: req.session.user.id,
      method: 'POST',
      endpoint: `/product-details/${productId}/comment`,
      action_summary: `Comentou no produto ${productId}`
    });

    res.redirect(`/product-details/${productId}?success=Comentário adicionado com sucesso!`);
  } catch (error) {
    if (req.files) await removeLocalCommentImages(req.files as Express.Multer.File[]);
    console.error('Erro ao adicionar comentário:', error);
    res.redirect(`/product-details/${productId}?error=Erro ao adicionar comentário`);
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Faça login para deletar comentários' });
  }

  const commentId = parseInt(req.params.id);

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    if (comment.user.person_id !== req.session.user.id && req.session.user.type !== 'admin') {
      return res.status(403).json({ error: 'Você não tem permissão para deletar este comentário' });
    }

    await CommentModel.deleteComment(commentId);

    await LogModel.createLog({
      user_id: req.session.user.id,
      method: 'DELETE',
      endpoint: `/product-detail/${commentId}/comment`,
      action_summary: `Deletou comentário ${commentId}`
    });

    res.json({ success: true, message: 'Comentário deletado com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    res.status(500).json({ error: 'Erro ao deletar comentário' });
  }
};

export const toggleLike = async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Faça login para curtir produtos' });
  }

  const commentId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { person_id: req.session.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        comment_id_user_id: {
          comment_id: commentId,
          user_id: user.id
        }
      }
    });

    let liked;
    if (existingLike) {
      await prisma.commentLike.delete({
        where: {
          comment_id_user_id: {
            comment_id: commentId,
            user_id: user.id
          }
        }
      });
      liked = false;
    } else {
      await prisma.commentLike.create({
        data: {
          comment_id: commentId,
          user_id: user.id
        }
      });
      liked = true;
    }

    const totalLikes = await prisma.commentLike.count({
      where: { comment_id: commentId }
    });
    await LogModel.createLog({
      user_id: req.session.user!.id,
      method: 'POST',
      endpoint: '/product-details/commentlike/:id',
      action_summary: `Curtiu comentário: ${commentId}`
    });

    res.json({ liked, totalLikes });
  } catch (error) {
    console.error('Erro ao processar like:', error);
    res.status(500).json({ error: 'Erro ao processar like' });
  }
};
