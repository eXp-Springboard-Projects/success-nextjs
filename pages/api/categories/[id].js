import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return getCategory(req, res, id);
    case 'PUT':
      return updateCategory(req, res, id);
    case 'DELETE':
      return deleteCategory(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getCategory(req, res, id) {
  try {
    const category = await prisma.categories.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateCategory(req, res, id) {
  try {
    const { name, slug, description } = req.body;

    const category = await prisma.categories.update({
      where: { id },
      data: {
        name,
        slug,
        description,
      },
    });

    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteCategory(req, res, id) {
  try {
    await prisma.categories.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
