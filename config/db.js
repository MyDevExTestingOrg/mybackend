import mongoose from 'mongoose'

const ConnectDb = async()=>{
     try{
         const connection = await mongoose.connect(process.env.MONGODB_URI);
         console.log(`mongodb connected successfully ${connection.connection.host}`)
     }
     catch(error)
     {
        console.log(`mongodb connection Failed ${error.message}`)
     }
}
export default ConnectDb;