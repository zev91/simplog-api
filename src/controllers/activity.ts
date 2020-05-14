import { Request, Response, NextFunction } from 'express';
// import Post, { PostStatus, IPostDocument } from '../models/Post';
import LikePost from '../models/LikePost';
import Comment from '../models/Comment';
// import Collection from '../models/Collection';
// import Follow from '../models/Follow';
// import User from '../models/User';
import Activity, { ActiveType } from '../models/Activity';
import { getMainBody } from '../utils/helper';
// import Activity from '../models/Activity';

export const getActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pageNo } = req.query;
    const { userId } = req.params;

    
    const myCustomLabels = {
      totalDocs: 'total',
      docs: 'datas',
      limit: 'pageSize',
      page: 'currentPage',
      // nextPage: false,
      // prevPage: false,
      totalPages: 'pageCount',
      pagingCounter: false,
      meta: 'page'
    };

    const userPopulateSelect = '_id avatar username company jobTitle selfDescription';
    const postPopulateSelect = '_id author headerBg body title postId read tags category createdAt';

    const options = {
      page: +pageNo || 1,
      limit: 15,
      lean: true,
      sort: { createdAt: -1 },
      customLabels: myCustomLabels,
      populate: [
        {
          path: 'user',
          select: userPopulateSelect
        },
        {
          path: 'publish',
          select: postPopulateSelect,
          populate: { path: 'author', select: userPopulateSelect }
        },
        {
          path: 'collectionPost',
          select: postPopulateSelect,
          populate: { path: 'author', select: userPopulateSelect }
        },
        {
          path: 'likePost',
          select: postPopulateSelect,
          populate: { path: 'author', select: userPopulateSelect }
        },
        {
          path: 'addComment',
          select: '_id body post replyToUser',
          populate: [
            { path: 'post', select: postPopulateSelect, populate: {
              path: 'author', select: userPopulateSelect
            } },
            { path: 'replyToUser', select: userPopulateSelect },
          ]
        },
        {
          path: 'followAuthor',
          select: userPopulateSelect
        }
      ]
    };

    let activities = await Activity.paginate({ user: userId }, options);
    let newActivities = JSON.parse(JSON.stringify(activities));


    const asyncAddParams =  newActivities.datas.map(async (activity: any) => {
      let id,likes,comments;
      const copyActivity = JSON.parse(JSON.stringify(activity));
      switch (copyActivity.activeType){
        case ActiveType.COLLECTION_POST:
          id = copyActivity.collectionPost['_id'];
          likes = await LikePost.find({post:id});
          comments = await Comment.find({post:id});
          copyActivity.collectionPost['likes'] = likes.length;
          copyActivity.collectionPost['comments'] = comments.length;
          copyActivity.collectionPost['main'] = getMainBody(copyActivity.collectionPost['body']);
          break;

        case ActiveType.COMMENT:
          id = copyActivity.addComment.post['_id'];
          likes = await LikePost.find({post:id});
          comments = await Comment.find({post:id});
          copyActivity.addComment.post['likes'] = likes.length;
          copyActivity.addComment.post['comments'] = comments.length;

          copyActivity.addComment.post['main'] = getMainBody(copyActivity.addComment.post['body']);
          break;

        case ActiveType.LIKE_POST:
          id = copyActivity.likePost['_id'];
          likes = await LikePost.find({post:id});
          comments = await Comment.find({post:id});
          copyActivity.likePost['likes'] = likes.length;
          copyActivity.likePost['comments'] = comments.length;
          copyActivity.likePost['main'] = getMainBody(copyActivity.likePost['body']);
          break;
        case ActiveType.PUBLISH:
          id = copyActivity.publish['_id'];
          likes = await LikePost.find({post:id});
          comments = await Comment.find({post:id});
          copyActivity.publish['likes'] = likes.length;
          copyActivity.publish['comments'] = comments.length;
          copyActivity.publish['main'] = getMainBody(copyActivity.publish['body']);
          break;
      }

      return copyActivity;
    });


    newActivities.datas = await Promise.all(asyncAddParams);

    res.json({
      success: true,
      data: newActivities
    });
  } catch (error) {
    next(error)
  }
};
