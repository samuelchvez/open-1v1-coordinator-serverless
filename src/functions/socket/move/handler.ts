import 'source-map-support/register';



const handler = async event => {
  console.log("neneco", {event})
  return {
    statusCode: 200,
    body: '',
  };
}


export const main = handler;
