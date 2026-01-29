const formatUser = (user, token) => ({
  email: user.email,
  token,
  username: user.username,
  bio: user.bio || '',
  image: user.image || '',
});

const formatProfile = (user, currentUserId) => {
  const following = !!(user.followers?.some(f => f.followerId === currentUserId));
  return {
    username: user.username,
    bio: user.bio || '',
    image: user.image || '',
    following,
  };
};

const formatArticle = (article, currentUserId) => {
  const tagList = (article.tags || []).map(t => t.tag.name);
  const favoritesCount = article._count?.favorites ?? (article.favorites ? article.favorites.length : 0);
  const favorited = currentUserId
    ? (article.favorites || []).some(favorite => favorite.userId === currentUserId)
    : false;

  return {
    slug: article.slug,
    title: article.title,
    description: article.description || '',
    body: article.body,
    tagList,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited,
    favoritesCount,
    author: formatProfile(article.author, currentUserId),
  };
};

const formatComment = (comment, currentUserId) => ({
  id: comment.id,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  body: comment.body,
  author: formatProfile(comment.author, currentUserId),
});

module.exports = {
  formatUser,
  formatProfile,
  formatArticle,
  formatComment,
};
