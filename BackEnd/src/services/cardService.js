import mongoose from 'mongoose';
import Card from '../config/models/Card.js';
import UserCard from '../config/models/UserCard.js';

export async function getCardsWithOwnership(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  return Card.aggregate([
    {
      $lookup: {
        from: 'usercards',  
        let: { cid: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$card', '$$cid'] },
                  { $eq: ['$user', userObjectId] }
                ]
              }
            }
          },
          {
            $project: {
              owned: 1,
              count: 1
            }
          }
        ],
        as: 'ownership'
      }
    },
    {
      $addFields: {
        owned: {
          $cond: {
            if: { $gt: [{ $size: '$ownership' }, 0] },
            then: { $arrayElemAt: ['$ownership.owned', 0] },
            else: false
          }
        }
      }
    },
    {
      $project: {
        ownership: 0
      }
    }
  ]);
}